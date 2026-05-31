import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';
import { updateSupportRequestForm } from './actions';

export const dynamic = 'force-dynamic';

interface SupportRequest {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    search?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
}

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const {
    status = 'open',
    category = '',
    search = '',
    page = '1',
    success = '',
    error = '',
  } = await searchParams;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 15;
  const offset = (pageNum - 1) * pageSize;

  const admin = createAdminClient();

  // 1. Fetch counts for stats row
  const [
    { count: totalCount },
    { count: openCount },
    { count: progressCount },
    { count: resolvedCount },
  ] = await Promise.all([
    admin.from('support_requests').select('id', { count: 'exact', head: true }),
    admin.from('support_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('support_requests').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    admin.from('support_requests').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
  ]);

  // 2. Fetch requests with filters & pagination
  let query = admin
    .from('support_requests')
    .select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
  }

  // Deterministic order
  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data: requestsData, count: filteredCount } = await query;
  const requests = (requestsData as SupportRequest[]) ?? [];
  const totalFilteredCount = filteredCount ?? 0;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const getQueryString = (newPageNum: number) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    params.set('page', newPageNum.toString());
    return `${ROUTES.adminSupport}?${params.toString()}`;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'payment': return '💰 Payment Issue';
      case 'access': return '🔑 Access / Account';
      case 'content': return '📚 Course Content';
      case 'account': return '👤 User Account';
      case 'feature': return '💡 Feature / Course Request';
      default: return '💬 General / Other';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Customer Support & Requests</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Respond to course suggestions, assignment requests, and general user issues.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Requests</div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">{totalCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Open</div>
          <div className="mt-2 text-2xl font-black text-red-650 dark:text-red-400">{openCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">In Progress</div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{progressCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resolved</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">{resolvedCount ?? 0}</div>
        </div>
      </div>

      {success && (
        <div className="rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-300">
          Support request updated successfully.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <form method="GET" className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Search box */}
          <div className="flex-1 space-y-1.5">
            <label htmlFor="search-input" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Search Email or Content
            </label>
            <input
              id="search-input"
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by email, subject, or message body..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-64 space-y-1.5">
            <label htmlFor="category-select" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Category
            </label>
            <select
              id="category-select"
              name="category"
              defaultValue={category}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="payment">💰 Payment</option>
              <option value="access">🔑 Access / Account</option>
              <option value="content">📚 Content / Assignment</option>
              <option value="feature">💡 Feature / Course Request</option>
              <option value="other">💬 General / Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-56 space-y-1.5">
            <label htmlFor="status-select" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Status
            </label>
            <select
              id="status-select"
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="all">All Requests</option>
              <option value="open">🔴 Open Requests</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="resolved">🟢 Resolved</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Filter
            </button>
            {(status !== 'open' || category || search) && (
              <Link
                href={ROUTES.adminSupport}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Support list */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <p className="text-sm text-zinc-500 font-medium">All caught up! No requests found matching the filter.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4 shadow-sm"
            >
              {/* Header metadata */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-zinc-900 dark:text-white">
                      {req.email}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      req.user_id 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {req.user_id ? 'Registered' : 'Guest / Anon'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500">
                    {req.phone && <span>📞 {req.phone} · </span>}
                    Submitted: {new Date(req.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl px-2.5 py-1 font-semibold">
                    {getCategoryLabel(req.category)}
                  </span>
                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                    req.status === 'open' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                    req.status === 'in_progress' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  }`}>
                    {req.status === 'open' ? '🔴 Open' : req.status === 'in_progress' ? '🟡 In Progress' : '🟢 Resolved'}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-800/80">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">Subject: {req.subject}</p>
                <p className="text-sm text-zinc-850 dark:text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap">
                  {req.message}
                </p>
              </div>

              {/* Response/Notes form */}
              <form action={updateSupportRequestForm} className="pt-2 border-t border-zinc-150 dark:border-zinc-800/80 grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] items-end">
                <input type="hidden" name="request_id" value={req.id} />
                
                <div className="space-y-1.5">
                  <label htmlFor={`notes-${req.id}`} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Resolution Notes
                  </label>
                  <input
                    id={`notes-${req.id}`}
                    type="text"
                    name="admin_notes"
                    defaultValue={req.admin_notes ?? ''}
                    placeholder="E.g. responded via email / unlocked course MPC-001..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`status-${req.id}`} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Status
                  </label>
                  <select
                    id={`status-${req.id}`}
                    name="status"
                    defaultValue={req.status}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-teal-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full lg:w-auto rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 px-5 py-2 text-xs font-bold text-white transition-colors"
                >
                  Save Status
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 rounded-2xl p-5 dark:border-zinc-800 dark:bg-zinc-950/20">
          <div className="text-sm text-zinc-500">
            Showing <span className="font-semibold">{requests.length}</span> of{' '}
            <span className="font-semibold">{totalFilteredCount}</span> items (Page{' '}
            <span className="font-semibold">{pageNum}</span> of {totalPages})
          </div>
          <div className="flex gap-2">
            <Link
              href={getQueryString(pageNum - 1)}
              className={`rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                pageNum <= 1 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Previous
            </Link>
            <Link
              href={getQueryString(pageNum + 1)}
              className={`rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                pageNum >= totalPages ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
