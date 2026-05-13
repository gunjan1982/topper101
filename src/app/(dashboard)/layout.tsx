import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '../(auth)/actions';
import { headers } from 'next/headers';
import PostHogIdentify from '../PostHogIdentify';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // PostHog: session_started — fire on every authenticated page load
  // Use headers to detect device type
  const headersList = await headers();
  const ua = headersList.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const deviceType = isMobile ? 'mobile' : 'desktop';

  await captureServerEvent(user.id, 'session_started', {
    device_type: deviceType,
    // viewport_width is only available client-side; set to null from server
    viewport_width: null,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <PostHogIdentify userId={user.id} email={user.email} />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold tracking-tight dark:text-white">Topper101</span>
            </Link>
            <nav className="hidden gap-6 text-sm font-medium md:flex">
              <Link href="/dashboard" className="text-zinc-950 dark:text-zinc-50">Dashboard</Link>
              <Link href="/courses" className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">Question Bank</Link>
              <Link href="/planner" className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">Study Planner</Link>
              <Link href="/settings" className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
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
