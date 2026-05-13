import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure public.users row exists (required for Google OAuth users who
      // never go through the email signup path which would create the row)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: upsertResult } = await supabase.from('users').upsert(
          {
            id: user.id,
            email: user.email!,
            name:
              (user.user_metadata?.full_name as string | undefined) ??
              (user.user_metadata?.name as string | undefined) ??
              null,
            auth_provider: user.app_metadata?.provider ?? 'google',
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );

        // Fire user_signed_up for new Google OAuth users (ignoreDuplicates means
        // upsertResult is null for existing users, non-null for new inserts)
        if (upsertResult) {
          await captureServerEvent(user.id, 'user_signed_up', {
            auth_provider: user.app_metadata?.provider ?? 'google',
          });
        }

        await captureServerEvent(user.id, 'user_logged_in', {
          auth_provider: user.app_metadata?.provider ?? 'google',
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
