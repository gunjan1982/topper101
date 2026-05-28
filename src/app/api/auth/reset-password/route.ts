import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      `${origin}/reset-password?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Session successfully established on the server cookies.
      // Redirect the user to the update password form.
      return NextResponse.redirect(`${origin}/reset-password/update`);
    } else {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
  }

  // Fallback: If no code or error, redirect to reset-password/update.
  // The browser will carry any hash fragments (e.g. #access_token=...)
  // so the client side can handle it if needed.
  return NextResponse.redirect(`${origin}/reset-password/update`);
}
