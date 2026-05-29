'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog-server';
import { grantSubjectEntitlement, REFERRAL_REWARD_LIMIT, firstFreeSubject } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Rewards the referrer user automatically on referred user's onboarding completion.
 * Grants a 'subject_unlock' entitlement to the referrer for their next locked paper.
 */
async function rewardReferrerOnOnboardingComplete(userId: string) {
  const admin = createAdminClient();
  const { data: currentUser } = await admin
    .from('users')
    .select('referred_by')
    .eq('id', userId)
    .single();

  const referralCode = currentUser?.referred_by?.trim();
  if (!referralCode) return;

  const { data: referrer } = await admin
    .from('users')
    .select('id, selected_papers')
    .eq('referral_code', referralCode)
    .neq('id', userId)
    .maybeSingle();

  if (!referrer?.id) return;

  // Check referrer hasn't already hit the cap
  const { count: rewardCount } = await admin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_user_id', referrer.id)
    .in('status', ['rewarded', 'qualified']);

  if ((rewardCount ?? 0) >= REFERRAL_REWARD_LIMIT) return;

  // Find the next locked paper in the referrer's selected papers
  const referrerPapers = (referrer.selected_papers as string[] | null) ?? [];

  const { data: existingEntitlements } = await admin
    .from('user_entitlements')
    .select('course_code')
    .eq('user_id', referrer.id)
    .eq('entitlement_type', 'subject_unlock');

  const alreadyUnlocked = new Set(
    (existingEntitlements ?? [])
      .map((row: { course_code: string | null }) => row.course_code)
      .filter((code): code is string => Boolean(code))
  );

  const lockedPapers = referrerPapers.filter((p) => !alreadyUnlocked.has(p));
  let rewardCourse = firstFreeSubject(lockedPapers);

  // Fallback: If no locked paper in selected_papers, find any course not yet unlocked
  if (!rewardCourse) {
    const { data: allCourses } = await admin
      .from('courses')
      .select('code');
    if (allCourses) {
      const fallbackCourse = allCourses.find((c) => !alreadyUnlocked.has(c.code));
      if (fallbackCourse) {
        rewardCourse = fallbackCourse.code;
      }
    }
  }

  if (rewardCourse) {
    // Grant subject entitlement to referrer
    await grantSubjectEntitlement({
      supabase: admin,
      userId: referrer.id,
      courseCode: rewardCourse,
      source: 'referral',
      sourceRef: userId,
      metadata: {
        reason: 'Referral reward — referred user completed onboarding',
        referred_user_id: userId,
      },
    });

    // Ensure the reward course is in the referrer's selected_papers array so it displays on their dashboard
    if (!referrerPapers.includes(rewardCourse)) {
      await admin
        .from('users')
        .update({ selected_papers: [...referrerPapers, rewardCourse] })
        .eq('id', referrer.id);
    }

    // Upsert the referral record as rewarded (and qualified)
    await admin
      .from('referrals')
      .upsert({
        referrer_user_id: referrer.id,
        referred_user_id: userId,
        referral_code: referralCode,
        status: 'rewarded',
        qualified_at: new Date().toISOString(),
        rewarded_at: new Date().toISOString(),
      }, { onConflict: 'referred_user_id' });
  } else {
    // Just record pending referral or set status qualified if no subjects can be unlocked
    await admin
      .from('referrals')
      .upsert({
        referrer_user_id: referrer.id,
        referred_user_id: userId,
        referral_code: referralCode,
        status: 'qualified',
        qualified_at: new Date().toISOString(),
      }, { onConflict: 'referred_user_id' });
  }
}

export async function updateYear(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, year, stream: year === 1 ? null : undefined },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  
  if (year === 2) {
    redirect(ROUTES.onboardingStream);
  } else {
    // For Year 1, we skip stream selection
    redirect(ROUTES.onboardingPapers);
  }
}

export async function updateStream(stream: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, year: 2, stream },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  redirect(ROUTES.onboardingPapers);
}

export async function completeOnboarding(
  papers: string[],
  meta?: { year: number; stream: string | null; startedAt: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (papers.length === 0) {
    throw new Error('Please select at least one paper.');
  }

  const { error } = await supabase
    .from('users')
    .update({ 
      year: meta?.year,
      stream: meta?.year === 1 ? null : meta?.stream,
      selected_papers: papers,
      onboarding_complete: true 
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  // Grant referral reward to referrer on onboarding completion
  await rewardReferrerOnOnboardingComplete(user.id);

  // PostHog: onboarding_completed
  const timeToComplete = meta?.startedAt
    ? Math.round((Date.now() - meta.startedAt) / 1000)
    : null;

  await captureServerEvent(user.id, 'onboarding_completed', {
    year: meta?.year ?? null,
    stream: meta?.stream ?? null,
    papers_selected: papers,
    time_to_complete: timeToComplete,
  });

  revalidatePath('/onboarding', 'layout');
  redirect(ROUTES.onboardingFreeSubject);
}

/**
 * Final onboarding step: user picks their one free subject to unlock.
 * Idempotent — if they already have a signup_free entitlement, skip the grant.
 */
export async function grantFreeSubject(courseCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!courseCode) {
    throw new Error('Please select a subject to unlock.');
  }

  // Guard: check if already has a signup_free entitlement
  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('entitlement_type', 'subject_unlock')
    .eq('source', 'signup_free')
    .maybeSingle();

  if (!existing) {
    await grantSubjectEntitlement({
      supabase,
      userId: user.id,
      courseCode,
      source: 'signup_free',
      metadata: { reason: 'User-selected free subject at onboarding' },
    });

    await captureServerEvent(user.id, 'free_subject_selected', {
      course_code: courseCode,
    });
  }

  revalidatePath(ROUTES.dashboard, 'layout');
  redirect(ROUTES.dashboard);
}
