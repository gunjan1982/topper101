import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog-server';
import { grantSubjectEntitlement, REFERRAL_REWARD_LIMIT, firstFreeSubject } from '@/lib/entitlements';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

type RazorpayOrderPaidEvent = {
  event: string;
  payload: {
    order: {
      entity: {
        id: string;
        amount_paid?: number;
        notes: {
          userId: string;
          planId: 'pass' | 'pro';
          billingCycle: 'monthly' | 'semester';
        };
      };
    };
  };
};

/**
 * When a referred user completes a purchase, grant their referrer a +1 subject unlock.
 * Updates the pending referrals record to 'rewarded'.
 */
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

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body) as RazorpayOrderPaidEvent;
    const supabase = await createClient();

    if (event.event === 'order.paid') {
      const { notes, id: orderId } = event.payload.order.entity;
      const { userId, planId, billingCycle } = notes;
      const amountPaid = event.payload.order.entity.amount_paid;

      // 1. Update user plan
      const { error: userError } = await supabase
        .from('users')
        .update({ plan_tier: planId })
        .eq('id', userId);

      if (userError) throw userError;

      // 2. Insert subscription record
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_tier: planId,
          billing_cycle: billingCycle,
          status: 'active',
          razorpay_payment_id: orderId,
          start_date: new Date().toISOString(),
          end_date: billingCycle === 'semester' 
            ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() 
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) throw subError;

      // 3. PostHog: payment_completed
      await captureServerEvent(userId, 'payment_completed', {
        plan_tier: planId,
        amount: amountPaid ? amountPaid / 100 : null, // convert paise → INR
        billing_cycle: billingCycle,
      });

      // 4. Referral reward: if paying user was referred, grant referrer +1 subject
      await grantReferralRewardForPayment(userId);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
