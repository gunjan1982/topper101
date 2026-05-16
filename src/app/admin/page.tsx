import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
};

function StatCard({ label, value, sub, href }: StatCardProps) {
  const inner = (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 ${href ? 'hover:border-teal-500 transition-colors' : ''}`}>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

export default async function AdminPage() {
  const admin = createAdminClient();

  // ── user counts ──────────────────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: freeUsers },
    { count: passUsers },
    { count: proUsers },
  ] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('plan_tier', 'free'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('plan_tier', 'pass'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('plan_tier', 'pro'),
  ]);

  // ── recent signups (last 7 days) ─────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newUsersWeek } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo);

  // ── referral stats ───────────────────────────────────────────────────────
  const [
    { count: pendingReferrals },
    { count: rewardedReferrals },
  ] = await Promise.all([
    admin.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'rewarded'),
  ]);

  // ── entitlements ─────────────────────────────────────────────────────────
  const [
    { count: freeUnlocks },
    { count: referralUnlocks },
  ] = await Promise.all([
    admin.from('user_entitlements').select('id', { count: 'exact', head: true }).eq('source', 'signup_free'),
    admin.from('user_entitlements').select('id', { count: 'exact', head: true }).eq('source', 'referral'),
  ]);

  // ── recent users ─────────────────────────────────────────────────────────
  const { data: recentUsers } = await admin
    .from('users')
    .select('id, email, plan_tier, created_at, onboarding_complete, selected_papers')
    .order('created_at', { ascending: false })
    .limit(10);

  const paidTotal = (passUsers ?? 0) + (proUsers ?? 0);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Live data from Supabase · Page analytics in{' '}
          <a href="https://eu.posthog.com" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">PostHog</a>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={totalUsers ?? 0} sub={`+${newUsersWeek ?? 0} this week`} href={ROUTES.adminUsers} />
        <StatCard label="Paid users" value={paidTotal} sub={`${passUsers ?? 0} pass · ${proUsers ?? 0} pro`} href={ROUTES.adminUsers} />
        <StatCard label="Free users" value={freeUsers ?? 0} sub={`${totalUsers ? Math.round((paidTotal / totalUsers) * 100) : 0}% conversion`} />
        <StatCard label="New this week" value={newUsersWeek ?? 0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Free unlocks granted" value={freeUnlocks ?? 0} sub="signup_free source" />
        <StatCard label="Referral unlocks" value={referralUnlocks ?? 0} sub="referral source" />
        <StatCard label="Pending referrals" value={pendingReferrals ?? 0} sub="referred user hasn't paid" />
        <StatCard label="Rewarded referrals" value={rewardedReferrals ?? 0} sub="referrer got their unlock" />
      </div>

      {/* Recent signups */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Recent signups</h2>
          <Link href={ROUTES.adminUsers} className="text-sm text-teal-700 hover:underline">View all users →</Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Onboarded</th>
                <th className="px-5 py-3 text-left">Papers</th>
                <th className="px-5 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {(recentUsers ?? []).map((u: {
                id: string;
                email: string;
                plan_tier: string;
                created_at: string;
                onboarding_complete: boolean;
                selected_papers: string[] | null;
              }) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-5 py-3">
                    <Link href={`${ROUTES.adminUsers}?search=${encodeURIComponent(u.email)}`} className="font-medium text-zinc-800 hover:text-teal-700 dark:text-zinc-200">
                      {u.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                      u.plan_tier === 'pro' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : u.plan_tier === 'pass' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {u.plan_tier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">{u.onboarding_complete ? '✅' : '⏳'}</td>
                  <td className="px-5 py-3 text-zinc-500">
                    {Array.isArray(u.selected_papers) ? u.selected_papers.join(', ') : '—'}
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-bold dark:text-white">External dashboards</h2>
        <div className="flex flex-wrap gap-3">
          <a href="https://eu.posthog.com" target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            PostHog Analytics ↗
          </a>
          <a href={`https://supabase.com/dashboard/project/gayauvhhgwbbqgrqajak`} target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Supabase ↗
          </a>
          <a href="https://vercel.com/gunjan1982" target="_blank" rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Vercel Deployments ↗
          </a>
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:border-teal-600 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Google Analytics ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
