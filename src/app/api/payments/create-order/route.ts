import { getRazorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { NextResponse } from 'next/server';

const PLAN_PRICES: Record<string, number> = {
  'pass-monthly': 29900, // in paise
  'pass-semester': 79900,
  'pro-monthly': 49900,
  'pro-semester': 129900,
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, billingCycle } = await request.json();
    const priceKey = `${planId}-${billingCycle}`;
    const amount = PLAN_PRICES[priceKey];

    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId,
        billingCycle,
      },
    };

    const order = await getRazorpay().orders.create(options);

    await captureServerEvent(user.id, 'payment_initiated', {
      plan_id: planId,
      billing_cycle: billingCycle,
      amount_inr: amount / 100,
      razorpay_order_id: order.id,
    });

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (error: unknown) {
    console.error('Razorpay order creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment order creation failed' },
      { status: 500 }
    );
  }
}
