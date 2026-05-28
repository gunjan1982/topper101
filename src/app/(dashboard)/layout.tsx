import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '../(auth)/actions';
import { headers } from 'next/headers';
import PostHogIdentify from '../PostHogIdentify';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';
import { ROUTES } from '@/lib/routes';
import DashboardNav from './DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // PostHog: session_started — fire on every authenticated page load
  // Use headers to detect device type
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const deviceType = isMobile ? 'mobile' : 'desktop';
  const { data: profile } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user.id)
    .single();

  await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id);

  await captureServerEvent(user.id, 'session_started', {
    device_type: deviceType,
    // viewport_width is only available client-side; set to null from server
    viewport_width: null,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <PostHogIdentify userId={user.id} email={user.email} phone={profile?.phone ?? null} />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href={ROUTES.dashboard} className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold tracking-tight dark:text-white">Topper101</span>
            </Link>
            <DashboardNav />
          </div>

          <div className="flex items-center gap-4">
            {user.email && (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).includes(user.email.toLowerCase()) && (
              <Link
                href={ROUTES.admin}
                className="rounded-full bg-teal-100 px-3.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 transition-colors"
              >
                Admin Panel 🛡️
              </Link>
            )}
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
