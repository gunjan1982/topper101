import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID_TIERS = ['exam_pass', 'full_archive'] as const;
type Tier = typeof VALID_TIERS[number];

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_TIERS.includes(plan as Tier)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Signature valid — update subscription tier in Supabase
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

    const { error } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: plan })
      .eq('id', user.id);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error('Razorpay verify error:', err);
    return NextResponse.json({ error: err.message ?? 'Verification failed' }, { status: 500 });
  }
}
