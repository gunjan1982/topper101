import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { safeNextPath } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));
  let referralCode: string | null = null;
  try {
    const nextUrlObj = new URL(next, origin);
    referralCode = nextUrlObj.searchParams.get('ref')?.trim() || null;
  } catch {
    // ignore
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure public.users row exists
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
            referred_by: referralCode,
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
  return NextResponse.redirect(`${origin}${ROUTES.login}?error=Could not authenticate user`);
}
