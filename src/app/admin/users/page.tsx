import { createAdminClient } from '@/lib/supabase/admin';
import UserTable from './UserTable';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; plan?: string }>;
}) {
  const { search = '', page: pageStr = '1', plan = '' } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();

  let query = admin
    .from('users')
    .select('id, email, name, phone, plan_tier, created_at, last_seen_at, onboarding_complete, selected_papers, referral_code, referred_by', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }
  if (plan) {
    query = query.eq('plan_tier', plan as 'free' | 'pass');
  }

  const { data: users, count } = await query;

  // Entitlement counts + unlocked course codes per user
  const userIds = (users ?? []).map((u: { id: string }) => u.id);
  const entitlementsByUser: Record<string, number> = {};
  const adminUnlockedByUser: Record<string, string[]> = {};
  if (userIds.length > 0) {
    const { data: ents } = await admin
      .from('user_entitlements')
      .select('user_id, course_code, source')
      .eq('entitlement_type', 'subject_unlock')
      .in('user_id', userIds);
    (ents ?? []).forEach((row: { user_id: string; course_code: string | null; source: string }) => {
      entitlementsByUser[row.user_id] = (entitlementsByUser[row.user_id] ?? 0) + 1;
      if (row.source === 'admin' && row.course_code) {
        adminUnlockedByUser[row.user_id] = adminUnlockedByUser[row.user_id] ?? [];
        adminUnlockedByUser[row.user_id].push(row.course_code);
      }
    });
  }

  // Referral reward counts per user (as referrer)
  const referralsByUser: Record<string, number> = {};
  const pageViewsByUser: Record<string, number> = {};
  const supportRequestsByUser: Record<string, number> = {};
  const questionMetricsByUser: Record<string, {
    questionsBeforePay: Set<string>;
    questionsAfterPay: Set<string>;
    answersBeforePay: Set<string>;
    answersAfterPay: Set<string>;
  }> = {};

  if (userIds.length > 0) {
    const { data: refs } = await admin
      .from('referrals')
      .select('referrer_user_id, status')
      .in('referrer_user_id', userIds);
    (refs ?? []).forEach((row: { referrer_user_id: string; status: string }) => {
      if (!referralsByUser[row.referrer_user_id]) referralsByUser[row.referrer_user_id] = 0;
      if (row.status === 'rewarded') referralsByUser[row.referrer_user_id]++;
    });

    const { data: pageEvents } = await admin
      .from('page_events')
      .select('user_id')
      .in('user_id', userIds);
    (pageEvents ?? []).forEach((row: { user_id: string | null }) => {
      if (!row.user_id) return;
      pageViewsByUser[row.user_id] = (pageViewsByUser[row.user_id] ?? 0) + 1;
    });

    const { data: supportRequests } = await admin
      .from('support_requests')
      .select('user_id')
      .in('user_id', userIds);
    (supportRequests ?? []).forEach((row: { user_id: string | null }) => {
      if (!row.user_id) return;
      supportRequestsByUser[row.user_id] = (supportRequestsByUser[row.user_id] ?? 0) + 1;
    });

    const { data: questionEvents } = await admin
      .from('user_question_events')
      .select('user_id, question_id, event_type, access_state')
      .in('user_id', userIds);
    (questionEvents ?? []).forEach((row: {
      user_id: string;
      question_id: string;
      event_type: string;
      access_state: string;
    }) => {
      questionMetricsByUser[row.user_id] ??= {
        questionsBeforePay: new Set<string>(),
        questionsAfterPay: new Set<string>(),
        answersBeforePay: new Set<string>(),
        answersAfterPay: new Set<string>(),
      };
      const metrics = questionMetricsByUser[row.user_id];
      if (row.event_type === 'question_viewed' && row.access_state === 'free') metrics.questionsBeforePay.add(row.question_id);
      if (row.event_type === 'question_viewed' && row.access_state === 'paid') metrics.questionsAfterPay.add(row.question_id);
      if (row.event_type === 'answer_viewed' && row.access_state === 'free') metrics.answersBeforePay.add(row.question_id);
      if (row.event_type === 'answer_viewed' && row.access_state === 'paid') metrics.answersAfterPay.add(row.question_id);
    });
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const enrichedUsers = (users ?? []).map((u: {
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
  }) => ({
    ...u,
    entitlementCount: entitlementsByUser[u.id] ?? 0,
    adminUnlockedCourses: adminUnlockedByUser[u.id] ?? [],
    referralRewardCount: referralsByUser[u.id] ?? 0,
    pageViewCount: pageViewsByUser[u.id] ?? 0,
    supportRequestCount: supportRequestsByUser[u.id] ?? 0,
    questionsBeforePay: questionMetricsByUser[u.id]?.questionsBeforePay.size ?? 0,
    questionsAfterPay: questionMetricsByUser[u.id]?.questionsAfterPay.size ?? 0,
    answersBeforePay: questionMetricsByUser[u.id]?.answersBeforePay.size ?? 0,
    answersAfterPay: questionMetricsByUser[u.id]?.answersAfterPay.size ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">{count ?? 0} total users</p>
      </div>

      <UserTable
        users={enrichedUsers}
        totalCount={count ?? 0}
        page={page}
        totalPages={totalPages}
        searchQuery={search}
        planFilter={plan}
      />
    </div>
  );
}
