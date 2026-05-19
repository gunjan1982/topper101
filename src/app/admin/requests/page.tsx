import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';
import { updateSupportRequest } from './actions';

type SupportRequest = {
  id: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = 'open' } = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from('support_requests')
    .select('id, user_id, email, phone, category, subject, message, status, priority, admin_notes, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: requests } = await query;
  const rows = (requests as SupportRequest[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Support Inbox</h1>
          <p className="mt-1 text-sm text-zinc-500">Requests submitted from the in-app Help page.</p>
        </div>
        <div className="flex gap-2">
          {['open', 'in_progress', 'resolved', 'all'].map((item) => (
            <Link
              key={item}
              href={`${ROUTES.adminRequests}?status=${item}`}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                status === item
                  ? 'bg-teal-700 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {item.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 p-12 text-center text-zinc-500 dark:border-zinc-800">
          No requests in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((request) => (
            <div key={request.id} className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-800">
                      {request.category}
                    </span>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30">
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold dark:text-white">{request.subject}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{request.message}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>{request.email}</span>
                    {request.phone && <span>{request.phone}</span>}
                    <span>{new Date(request.created_at).toLocaleString('en-IN')}</span>
                    {request.user_id && (
                      <Link className="font-bold text-teal-700 hover:underline" href={`${ROUTES.adminUsers}?search=${encodeURIComponent(request.email)}`}>
                        user record
                      </Link>
                    )}
                  </div>
                </div>

                <form action={updateSupportRequest} className="w-full space-y-3 lg:w-80">
                  <input type="hidden" name="request_id" value={request.id} />
                  <select
                    name="status"
                    defaultValue={request.status}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <textarea
                    name="admin_notes"
                    defaultValue={request.admin_notes ?? ''}
                    placeholder="Admin notes"
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                  <button className="rounded-full bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-600">
                    Save
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
