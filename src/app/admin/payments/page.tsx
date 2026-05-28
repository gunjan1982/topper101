import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

type PaymentHistoryEntry = {
  offer_id: string | null;
  offer_label: string | null;
  subject_limit: number;
  unlocked_subjects: string[] | null;
  amount_paid: number | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_tier: string;
  billing_cycle: string | null;
  status: string;
  razorpay_payment_id: string | null;
  created_at: string;
  payment_history: PaymentHistoryEntry[] | null;
  users: {
    email: string;
    name: string | null;
    phone: string | null;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = '', page: pageStr = '1' } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();

  // 1. Fetch total statistics for overview cards
  const { data: allSubscriptions } = await admin
    .from('subscriptions')
    .select('status, payment_history');

  let totalRevenue = 0;
  let activePassesCount = 0;
  let singleSubjectCount = 0;
  let multiSubjectCount = 0;

  (allSubscriptions ?? []).forEach((sub) => {
    if (sub.status === 'active') {
      activePassesCount++;
    }
    const history = (sub.payment_history as PaymentHistoryEntry[] | null) ?? [];
    history.forEach((payment) => {
      totalRevenue += payment.amount_paid ?? 0;
      if (payment.subject_limit === 1) {
        singleSubjectCount++;
      } else if (payment.subject_limit > 1) {
        multiSubjectCount++;
      }
    });
  });

  // 2. Fetch paginated list of subscriptions with user details
  let query = admin
    .from('subscriptions')
    .select('*, users!inner(email, name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike('users.email', `%${search}%`);
  }

  const { data, count } = await query;
  const subscriptions = (data as unknown as SubscriptionRow[]) ?? [];

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Payments</h1>
        <p className="mt-1 text-sm text-zinc-500">Track user purchases, transaction ids, and unlocked subjects.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Revenue</div>
          <div className="mt-2 text-3xl font-bold text-teal-700 dark:text-teal-400">₹{totalRevenue}</div>
          <div className="mt-1 text-xs text-zinc-500">Gross sales collected</div>
        </div>

        {/* Active Passes */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Upgrades</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{activePassesCount}</div>
          <div className="mt-1 text-xs text-zinc-500">Currently active plans</div>
        </div>

        {/* 1 Subject Purchases */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">1 Subject Unlocks</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{singleSubjectCount}</div>
          <div className="mt-1 text-xs text-zinc-500">₹99/199 pricing level</div>
        </div>

        {/* 5 Subjects Purchases */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">5 Subjects Unlocks</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{multiSubjectCount}</div>
          <div className="mt-1 text-xs text-zinc-500">₹299/499 pricing level</div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form method="GET" className="flex max-w-sm flex-1 gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by user email..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/payments"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear
            </Link>
          )}
        </form>
        <div className="text-sm text-zinc-500">{count ?? 0} matches</div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan / Cycle</th>
                <th className="px-6 py-4">Subjects Unlocked</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Razorpay Reference</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-900 dark:text-zinc-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const historyEntry = sub.payment_history?.[0];
                  const amount = historyEntry?.amount_paid ?? 0;
                  const subjects = historyEntry?.unlocked_subjects ?? [];
                  const userEmail = sub.users?.email ?? 'Unknown User';

                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-white">
                          {sub.users?.name || 'No Name'}
                        </div>
                        <a
                          href={`mailto:${userEmail}`}
                          className="text-xs text-teal-600 hover:underline dark:text-teal-400"
                        >
                          {userEmail}
                        </a>
                        {sub.users?.phone && (
                          <div className="text-xs text-zinc-500 mt-0.5">{sub.users.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-400">
                          {sub.plan_tier.toUpperCase()}
                        </span>
                        <div className="text-xs text-zinc-500 mt-1 capitalize">
                          {sub.billing_cycle || 'N/A'} cycle
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {subjects.length === 0 ? (
                          <span className="text-xs text-zinc-400">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {subjects.map((code) => (
                              <span
                                key={code}
                                className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-950 dark:text-zinc-50">
                        ₹{amount}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                        {sub.razorpay_payment_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-500">
              Showing page <span className="font-semibold">{page}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/payments?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className={`rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                  page <= 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/admin/payments?page=${page + 1}${search ? `&search=${search}` : ''}`}
                className={`rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                  page >= totalPages ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
