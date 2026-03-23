import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
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

    await supabase.auth.exchangeCodeForSession(code);

    // If next is check-profile, decide where to send the user
    if (next === '/auth/check-profile') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, enrolled_courses')
          .eq('id', user.id)
          .single();

        // New Google user — needs to pick courses
        if (!profile || !profile.enrolled_courses?.length) {
          // Pre-create a minimal profile so onboarding can upsert cleanly
          await supabase.from('user_profiles').upsert({
            id: user.id,
            email: user.email!,
            enrolled_courses: [],
            subscription_tier: 'free',
          });
          return NextResponse.redirect(new URL('/onboarding?step=courses', requestUrl.origin));
        }

        // Returning user — go straight to dashboard
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next === '/auth/check-profile' ? '/dashboard' : next, requestUrl.origin));
}
