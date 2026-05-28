import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog-server';
import {
  activeSubjectEntitlements,
  firstFreeSubject,
  grantSubjectEntitlement,
  REFERRAL_REWARD_LIMIT,
} from '@/lib/entitlements';

async function grantReferralRewardForPayment(payingUserId: string) {
  const admin = createAdminClient();

  // Look up if there's a pending referral for this paying user
  const { data: referral } = await admin
    .from('referrals')
    .select('id, referrer_user_id, referral_code')
    .eq('referred_user_id', payingUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!referral?.referrer_user_id) return;

  // Verify referrer hasn't hit the reward cap
  const { count: rewardCount } = await admin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_user_id', referral.referrer_user_id)
    .in('status', ['rewarded', 'qualified']);

  if ((rewardCount ?? 0) >= REFERRAL_REWARD_LIMIT) return;

  // Find the next locked paper in the referrer's selected papers
  const { data: referrer } = await admin
    .from('users')
    .select('selected_papers')
    .eq('id', referral.referrer_user_id)
    .single();

  const referrerPapers = (referrer?.selected_papers as string[] | null) ?? [];

  const { data: existingEntitlements } = await admin
    .from('user_entitlements')
    .select('course_code')
    .eq('user_id', referral.referrer_user_id)
    .eq('entitlement_type', 'subject_unlock');

  const alreadyUnlocked = new Set(
    (existingEntitlements ?? [])
      .map((row: { course_code: string | null }) => row.course_code)
      .filter((code): code is string => Boolean(code))
  );

  const lockedPapers = referrerPapers.filter((p) => !alreadyUnlocked.has(p));
  const rewardCourse = firstFreeSubject(lockedPapers);

  if (!rewardCourse) return;

  await grantSubjectEntitlement({
    supabase: admin,
    userId: referral.referrer_user_id,
    courseCode: rewardCourse,
    source: 'referral',
    sourceRef: payingUserId,
    metadata: {
      reason: 'Referral reward — referred user made a purchase',
      referred_user_id: payingUserId,
    },
  });

  // Mark referral as rewarded
  await admin
    .from('referrals')
    .update({
      status: 'rewarded',
      rewarded_at: new Date().toISOString(),
    })
    .eq('id', referral.id);
}

async function grantPurchasedSubjectUnlocks({
  userId,
  orderId,
  subjectLimit,
  offerId,
  billingCycle,
}: {
  userId: string;
  orderId: string;
  subjectLimit: number;
  offerId?: string;
  billingCycle: 'monthly' | 'semester';
}) {
  const admin = createAdminClient();
  // Fixed TEE expiry dates — not rolling from purchase date
  const expiresAt = billingCycle === 'semester'
    ? new Date('2026-12-31T18:29:59.000Z').toISOString() // 31 Dec 2026 23:59 IST
    : new Date('2026-06-30T18:29:59.000Z').toISOString(); // 30 Jun 2026 23:59 IST

  const { data: userData } = await admin
    .from('users')
    .select('selected_papers')
    .eq('id', userId)
    .single();

  const selectedPapers = (userData?.selected_papers as string[] | null) ?? [];
  if (selectedPapers.length === 0) return [];

  const { data: entitlementRows } = await admin
    .from('user_entitlements')
    .select('course_code, entitlement_type, source, expires_at')
    .eq('user_id', userId)
    .eq('entitlement_type', 'subject_unlock');

  const activeUnlocks = activeSubjectEntitlements(entitlementRows);
  const alreadyUnlocked = new Set(activeUnlocks.map((row) => row.course_code as string));
  const coursesToUnlock = selectedPapers
    .filter((courseCode) => !alreadyUnlocked.has(courseCode))
    .slice(0, subjectLimit);

  for (const courseCode of coursesToUnlock) {
    await grantSubjectEntitlement({
      supabase: admin,
      userId,
      courseCode,
      source: 'purchase',
      sourceRef: orderId,
      expiresAt,
      metadata: {
        reason: 'Topper Pass subject purchase',
        offer_id: offerId ?? null,
        subject_limit: subjectLimit,
      },
    });
  }

  return coursesToUnlock;
}

export async function processOrderPaymentSuccess({
  userId,
  orderId,
  amountPaid,
  planId,
  billingCycle,
  subjectLimit,
  offerId,
  offerLabel,
}: {
  userId: string;
  orderId: string;
  amountPaid?: number;
  planId: 'pass';
  billingCycle: 'monthly' | 'semester';
  subjectLimit: number;
  offerId?: string;
  offerLabel?: string;
}) {
  const admin = createAdminClient();

  // Deduplicate: Check if subscription already exists for this orderId
  const { data: existingSub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('razorpay_payment_id', orderId)
    .maybeSingle();

  if (existingSub) {
    console.log(`[payments-service] Order ${orderId} already processed, skipping.`);
    return;
  }

  const purchasedSubjects = await grantPurchasedSubjectUnlocks({
    userId,
    orderId,
    subjectLimit,
    offerId,
    billingCycle,
  });

  // 1. Update user plan
  const { error: userError } = await admin
    .from('users')
    .update({ plan_tier: planId })
    .eq('id', userId);

  if (userError) throw userError;

  // 2. Insert subscription record
  const { error: subError } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_tier: planId,
      billing_cycle: billingCycle,
      status: 'active',
      razorpay_payment_id: orderId,
      start_date: new Date().toISOString(),
      end_date: billingCycle === 'semester'
        ? new Date('2026-12-31T18:29:59.000Z').toISOString()
        : new Date('2026-06-30T18:29:59.000Z').toISOString(),
      payment_history: [{
        offer_id: offerId ?? null,
        offer_label: offerLabel ?? null,
        subject_limit: subjectLimit,
        unlocked_subjects: purchasedSubjects,
        amount_paid: amountPaid ? amountPaid / 100 : null,
      }],
    });

  if (subError) throw subError;

  // 3. PostHog: payment_completed
  await captureServerEvent(userId, 'payment_completed', {
    plan_tier: planId,
    amount: amountPaid ? amountPaid / 100 : null, // convert paise → INR
    billing_cycle: billingCycle,
    offer_id: offerId ?? null,
    subject_limit: subjectLimit,
    unlocked_subjects: purchasedSubjects,
  });

  // 4. Referral reward: if paying user was referred, grant referrer +1 subject
  await grantReferralRewardForPayment(userId);
}
