import { getRazorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { NextResponse } from 'next/server';

const PASS_OFFERS: Record<string, {
  amount: number;
  subjectLimit: number;
  billingCycle: 'monthly' | 'semester';
  label: string;
}> = {
  'pass-1-subject-monthly': {
    amount: 9900,
    subjectLimit: 1,
    billingCycle: 'monthly',
    label: 'Topper Pass - 1 subject (TEE Jun 2026)',
  },
  'pass-1-subject-semester': {
    amount: 19900,
    subjectLimit: 1,
    billingCycle: 'semester',
    label: 'Topper Pass - 1 subject (Semester Dec 2026)',
  },
  'pass-5-subjects-monthly': {
    amount: 29900,
    subjectLimit: 5,
    billingCycle: 'monthly',
    label: 'Topper Pass - 5 subjects (TEE Jun 2026)',
  },
  'pass-5-subjects-semester': {
    amount: 49900,
    subjectLimit: 5,
    billingCycle: 'semester',
    label: 'Topper Pass - 5 subjects (Semester Dec 2026)',
  },
};

export async function POST(request: Request) {
  try {
    // Guard: Validate required env vars are present
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay env vars missing:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      });
      return NextResponse.json({ error: 'Payment gateway not configured. Please contact support.' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { offerId } = await request.json();
    const offer = PASS_OFFERS[offerId as string];

    if (!offer) {
      return NextResponse.json({ error: 'Invalid offer' }, { status: 400 });
    }

    const options = {
      amount: offer.amount,
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        planId: 'pass',
        billingCycle: offer.billingCycle,
        offerId,
        subjectLimit: String(offer.subjectLimit),
        offerLabel: offer.label,
      },
    };

    const order = await getRazorpay().orders.create(options);

    await captureServerEvent(user.id, 'payment_initiated', {
      plan_id: 'pass',
      billing_cycle: offer.billingCycle,
      offer_id: offerId,
      subject_limit: offer.subjectLimit,
      amount_inr: offer.amount / 100,
      razorpay_order_id: order.id,
    });

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (error: unknown) {
    // Log full error details for Vercel function logs
    const errMsg = error instanceof Error ? error.message : String(error);
    const errDetails = error && typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
    console.error('[payments/create-order] Razorpay order creation failed:', errMsg, errDetails);
    return NextResponse.json(
      { error: errMsg || 'Payment order creation failed' },
      { status: 500 }
    );
  }
}
