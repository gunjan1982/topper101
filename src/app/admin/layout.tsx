import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import Logo from '@/app/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.has((user.email ?? '').toLowerCase())) {
    // Not an admin — send them to their dashboard, not a 404
    redirect(ROUTES.dashboard);
  }

  const NAV = [
    { href: ROUTES.admin, label: 'Overview' },
    { href: ROUTES.adminUsers, label: 'Users' },
    { href: ROUTES.adminRequests, label: 'AI QA' },
    { href: ROUTES.adminSupport, label: 'Support' },
    { href: ROUTES.adminPayments, label: 'Payments' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href={ROUTES.admin} className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Admin</span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              {NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-zinc-600 hover:text-teal-700 dark:text-zinc-400 dark:hover:text-teal-400"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">{user.email}</span>
            <Link href={ROUTES.dashboard} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300">
              Back to app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
