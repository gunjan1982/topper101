import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PLAN_AMOUNTS: Record<string, { amount: number; name: string }> = {
  exam_pass:    { amount: 49900,  name: 'Topper101 Exam Pass' },    // ₹499 in paise
  full_archive: { amount: 79900,  name: 'Topper101 Full Archive' }, // ₹799 in paise
};

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!PLAN_AMOUNTS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify user is authenticated
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: PLAN_AMOUNTS[plan].amount,
      currency: 'INR',
      notes: {
        user_id: user.id,
        email: user.email ?? '',
        plan,
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      plan_name: PLAN_AMOUNTS[plan].name,
      key_id: process.env.RAZORPAY_KEY_ID!,
    });
  } catch (err: any) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json({ error: err.message ?? 'Failed to create order' }, { status: 500 });
  }
}
