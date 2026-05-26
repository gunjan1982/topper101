'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateUserPlanTier, grantAdminSubjectEntitlement, revokeAdminSubjectEntitlement } from './actions';
import { COURSE_CATALOG } from '@/lib/courseCatalog';

type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  plan_tier: string;
  created_at: string;
  last_seen_at: string | null;
  onboarding_complete: boolean;
  selected_papers: string[] | null;
  referral_code: string | null;
  referred_by: string | null;
  entitlementCount: number;
  adminUnlockedCourses: string[];
  referralRewardCount: number;
  pageViewCount: number;
  supportRequestCount: number;
  questionsBeforePay: number;
  questionsAfterPay: number;
  answersBeforePay: number;
  answersAfterPay: number;
};

interface UserTableProps {
  users: User[];
  totalCount: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  planFilter: string;
}

const PLAN_COLORS: Record<string, string> = {
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  pass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  free: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
      {plan}
    </span>
  );
}

function PlanEditor({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(newPlan: 'free' | 'pass' | 'pro') {
    startTransition(async () => {
      await updateUserPlanTier(user.id, newPlan);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5"
        title="Click to change plan"
      >
        <PlanBadge plan={user.plan_tier} />
        <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(['free', 'pass', 'pro'] as const).map((p) => (
        <button
          key={p}
          onClick={() => handleChange(p)}
          disabled={isPending}
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-all disabled:opacity-50 ${
            p === user.plan_tier
              ? (PLAN_COLORS[p] ?? PLAN_COLORS.free) + ' ring-2 ring-teal-500 ring-offset-1'
              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
          }`}
        >
          {p}
        </button>
      ))}
      <button onClick={() => setEditing(false)} className="ml-1 text-xs text-zinc-400 hover:text-zinc-600">✕</button>
    </div>
  );
}

function SubjectManager({ user, onClose }: { user: User; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(user.adminUnlockedCourses));
  const hasFullAccess = user.plan_tier === 'pro';

  function toggle(code: string) {
    if (hasFullAccess) return;
    const isNowUnlocked = unlocked.has(code);
    setUnlocked((prev) => {
      const next = new Set(prev);
      isNowUnlocked ? next.delete(code) : next.add(code);
      return next;
    });
    startTransition(async () => {
      if (isNowUnlocked) {
        await revokeAdminSubjectEntitlement(user.id, code);
      } else {
        await grantAdminSubjectEntitlement(user.id, code);
      }
    });
  }

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">
          Subject Unlocks — {user.email}
        </span>
        <button onClick={onClose} className="text-xs text-zinc-400 hover:text-zinc-600">✕ Close</button>
      </div>
      {hasFullAccess && (
        <p className="mb-3 text-xs text-purple-600 dark:text-purple-400 font-medium">
          ★ Pro plan — full access to all subjects
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {COURSE_CATALOG.map((course) => {
          const isUnlocked = hasFullAccess || unlocked.has(course.code);
          return (
            <button
              key={course.code}
              onClick={() => toggle(course.code)}
              disabled={pending || hasFullAccess}
              title={course.name}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                isUnlocked
                  ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-300'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-teal-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
              } disabled:cursor-default`}
            >
              {isUnlocked ? '✓' : '+'} {course.code}
            </button>
          );
        })}
      </div>
      {pending && <p className="mt-2 text-xs text-zinc-400 animate-pulse">Saving…</p>}
    </div>
  );
}

export default function UserTable({ users, totalCount, page, totalPages, searchQuery, planFilter }: UserTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [expandedSubjectUserId, setExpandedSubjectUserId] = useState<string | null>(null);

  function buildHref(params: Record<string, string | number>) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', String(params.search));
    if (params.plan) sp.set('plan', String(params.plan));
    if (params.page && Number(params.page) > 1) sp.set('page', String(params.page));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref({ search, plan: planFilter }));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button type="submit" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-600">
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearch(''); router.push(buildHref({ plan: planFilter })); }}
              className="text-sm text-zinc-400 hover:text-zinc-700"
            >
              Clear
            </button>
          )}
        </form>
        <div className="flex gap-2">
          {['', 'free', 'pass'].map((p) => (
            <button
              key={p}
              onClick={() => router.push(buildHref({ search: searchQuery, plan: p }))}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                planFilter === p
                  ? 'bg-teal-700 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {p || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 text-left">User</th>
              <th className="px-5 py-3 text-left">Plan</th>
              <th className="px-5 py-3 text-left">Papers</th>
              <th className="px-5 py-3 text-left">Unlocks</th>
              <th className="px-5 py-3 text-left">Seen</th>
              <th className="px-5 py-3 text-left">Answers</th>
              <th className="px-5 py-3 text-left">Activity</th>
              <th className="px-5 py-3 text-left">Referrals earned</th>
              <th className="px-5 py-3 text-left">Ref code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-zinc-400">No users found.</td>
              </tr>
            )}
            {users.map((u) => (
              <>
              <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-5 py-3">
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">{u.email}</div>
                  {u.name && <div className="text-xs text-zinc-400">{u.name}</div>}
                  {u.phone && <div className="text-xs text-zinc-500">{u.phone}</div>}
                  {!u.onboarding_complete && (
                    <span className="text-xs text-amber-600">⏳ onboarding pending</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <PlanEditor user={u} />
                </td>
                <td className="px-5 py-3 text-zinc-500 text-xs">
                  {Array.isArray(u.selected_papers) && u.selected_papers.length > 0
                    ? u.selected_papers.join(', ')
                    : '—'}
                </td>
                <td className="px-5 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col items-center gap-1">
                    <span>{u.entitlementCount > 0 ? u.entitlementCount : <span className="text-zinc-400">0</span>}</span>
                    <button
                      onClick={() => setExpandedSubjectUserId(expandedSubjectUserId === u.id ? null : u.id)}
                      className="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-200 font-medium"
                    >
                      {expandedSubjectUserId === u.id ? 'hide ▲' : 'manage ▾'}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <div>{u.questionsBeforePay} free</div>
                  <div>{u.questionsAfterPay} paid</div>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <div>{u.answersBeforePay} free</div>
                  <div>{u.answersAfterPay} paid</div>
                </td>
                <td className="px-5 py-3 text-xs text-zinc-500">
                  <div>{u.pageViewCount} page views</div>
                  <div>{u.supportRequestCount} requests</div>
                  <div>
                    {u.last_seen_at
                      ? `Last ${new Date(u.last_seen_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                      : 'No session yet'}
                  </div>
                </td>
                <td className="px-5 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">
                  {u.referralRewardCount > 0 ? u.referralRewardCount : <span className="text-zinc-400">0</span>}
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-zinc-500">{u.referral_code ?? '—'}</span>
                  {u.referred_by && (
                    <div className="text-xs text-teal-600">via {u.referred_by}</div>
                  )}
                </td>
              </tr>
              {expandedSubjectUserId === u.id && (
                <tr>
                  <td colSpan={9} className="p-0 border-b border-zinc-100 dark:border-zinc-700">
                    <SubjectManager user={u} onClose={() => setExpandedSubjectUserId(null)} />
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages} · {totalCount} users
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => router.push(buildHref({ search: searchQuery, plan: planFilter, page: page - 1 }))}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:border-teal-600 dark:border-zinc-700"
              >
                ← Prev
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() => router.push(buildHref({ search: searchQuery, plan: planFilter, page: page + 1 }))}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:border-teal-600 dark:border-zinc-700"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
