'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV_LINKS } from '@/lib/routes';

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden gap-6 text-sm font-medium md:flex">
      {DASHBOARD_NAV_LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive
                ? 'text-zinc-950 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors'
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
