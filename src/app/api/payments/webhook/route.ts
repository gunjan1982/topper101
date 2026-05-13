import { getRazorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

    const event = JSON.parse(body);
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
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
