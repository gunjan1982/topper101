import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (code) {
    try {
      const admin = createAdminClient();

      // Look up user with this referral code
      const { data: referrer } = await admin
        .from('users')
        .select('id, referral_clicks')
        .eq('referral_code', code)
        .maybeSingle();

      if (referrer) {
        // Increment click count
        await admin
          .from('users')
          .update({ referral_clicks: (referrer.referral_clicks ?? 0) + 1 })
          .eq('id', referrer.id);
      }
    } catch (err) {
      console.error('Error tracking referral click:', err);
    }
  }

  // Redirect to signup page with the ref query parameter
  const targetUrl = new URL('/signup', request.nextUrl.origin);
  if (code) {
    targetUrl.searchParams.set('ref', code);
  }

  return NextResponse.redirect(targetUrl);
}
