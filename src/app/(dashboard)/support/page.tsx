import { createClient } from '@/lib/supabase/server';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { ROUTES } from '@/lib/routes';
import { redirect } from 'next/navigation';
import { submitSupportRequest } from './actions';

type SupportRequest = {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { data: requests } = await supabase
    .from('support_requests')
    .select('id, category, subject, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Help and Requests</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Send payment, access, content, or account requests to the Topper101 admin inbox.
        </p>
      </div>

      {params.submitted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200">
          Request sent. We will review it from the admin inbox.
        </div>
      )}

      {params.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
          {params.error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <form action={submitSupportRequest} className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Category</span>
            <select
              name="category"
              defaultValue="payment"
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="payment">Payment</option>
              <option value="access">Access</option>
              <option value="content">Content correction</option>
              <option value="account">Account</option>
              <option value="feature">Feature request</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Subject</span>
            <input
              name="subject"
              required
              maxLength={140}
              placeholder="Short summary"
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Message</span>
            <textarea
              name="message"
              required
              rows={7}
              placeholder="Tell us what happened, including course code or payment details if relevant."
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-teal-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95"
          >
            Send Request
          </button>
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold dark:text-white">Direct Email</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              For urgent payment issues, email us directly.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-4 inline-block text-sm font-bold text-teal-700 hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold dark:text-white">Recent Requests</h2>
            <div className="mt-4 space-y-3">
              {((requests as SupportRequest[] | null) ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">No requests yet.</p>
              ) : (
                ((requests as SupportRequest[] | null) ?? []).map((request) => (
                  <div key={request.id} className="rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{request.subject}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">{request.category}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
