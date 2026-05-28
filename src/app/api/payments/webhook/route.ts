import { processOrderPaymentSuccess } from '@/lib/payments-service';
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
          planId: 'pass';
          billingCycle: 'monthly' | 'semester';
          offerId?: string;
          subjectLimit?: string;
          offerLabel?: string;
        };
      };
    };
  };
};

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

    if (event.event === 'order.paid') {
      const { notes, id: orderId } = event.payload.order.entity;
      const { userId, planId, billingCycle } = notes;
      const amountPaid = event.payload.order.entity.amount_paid;
      const subjectLimit = Number.parseInt(notes.subjectLimit ?? '1', 10);

      await processOrderPaymentSuccess({
        userId,
        orderId,
        amountPaid,
        planId,
        billingCycle,
        subjectLimit: Number.isFinite(subjectLimit) ? subjectLimit : 1,
        offerId: notes.offerId,
        offerLabel: notes.offerLabel,
      });
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
