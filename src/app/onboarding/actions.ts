'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog-server';
import { grantSubjectEntitlement, REFERRAL_REWARD_LIMIT } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function nextUnlockCandidate(papers: readonly string[], alreadyUnlocked: readonly string[]) {
  const lockedPapers = papers.filter((paper) => !alreadyUnlocked.includes(paper));
  // Return the first locked paper (caller may use exam-schedule ordering upstream)
  return lockedPapers[0] ?? null;
}

/**
 * Creates a pending referral record linking referrer ↔ referred user.
 * No entitlements are granted here — that happens in the payment webhook
 * when the referred user makes their first purchase.
 */
async function recordPendingReferral(userId: string) {
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
    .select('id')
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

  // Upsert pending record (idempotent — safe to call again if user re-onboards)
  await admin
    .from('referrals')
    .upsert({
      referrer_user_id: referrer.id,
      referred_user_id: userId,
      referral_code: referralCode,
      status: 'pending',
    }, { onConflict: 'referred_user_id' });
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

  // Record referral relationship (pending — entitlement granted when referred user pays)
  await recordPendingReferral(user.id);

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
