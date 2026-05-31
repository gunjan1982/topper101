import { getRazorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { processOrderPaymentSuccess } from '@/lib/payments-service';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // Guard: Validate required env vars are present
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay env vars missing on verification:', {
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      });
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment signature details' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('[payments/verify] Signature mismatch:', {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json({ error: 'Payment verification signature invalid' }, { status: 400 });
    }

    // Fetch the order from Razorpay to verify the details and prevent client spoofing
    const order = await getRazorpay().orders.fetch(razorpay_order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { notes } = order;
    if (!notes || notes.userId !== user.id) {
      console.error('[payments/verify] Order user mismatch or missing notes:', {
        orderUserId: notes?.userId,
        sessionUserId: user.id,
      });
      return NextResponse.json({ error: 'Unauthorized user mismatch' }, { status: 403 });
    }

    const amountPaid = order.amount_paid || order.amount; // Use amount paid if present, else original amount
    const subjectLimit = Number.parseInt(String(notes.subjectLimit ?? '1'), 10);
    const creditCount = notes && typeof notes === 'object' && 'creditCount' in notes
      ? Number.parseInt(String((notes as Record<string, unknown>).creditCount), 10)
      : 0;

    // Call shared service to process database logic idempotently
    await processOrderPaymentSuccess({
      userId: user.id,
      orderId: razorpay_order_id,
      amountPaid: typeof amountPaid === 'number' ? amountPaid : undefined,
      planId: 'pass',
      billingCycle: notes.billingCycle as 'monthly' | 'semester',
      subjectLimit: Number.isFinite(subjectLimit) ? subjectLimit : 1,
      creditCount: Number.isFinite(creditCount) ? creditCount : 0,
      offerId: notes.offerId ? String(notes.offerId) : undefined,
      offerLabel: notes.offerLabel ? String(notes.offerLabel) : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[payments/verify] Error during verification processing:', error);
    return NextResponse.json(
      { error: errMsg || 'Verification processing failed' },
      { status: 500 }
    );
  }
}
