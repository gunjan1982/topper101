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
    .select('id, email, name, plan_tier, created_at, onboarding_complete, selected_papers, referral_code, referred_by', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }
  if (plan) {
    query = query.eq('plan_tier', plan as 'free' | 'pass' | 'pro');
  }

  const { data: users, count } = await query;

  // Entitlement counts per user
  const userIds = (users ?? []).map((u: { id: string }) => u.id);
  let entitlementsByUser: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: ents } = await admin
      .from('user_entitlements')
      .select('user_id')
      .in('user_id', userIds);
    (ents ?? []).forEach((row: { user_id: string }) => {
      entitlementsByUser[row.user_id] = (entitlementsByUser[row.user_id] ?? 0) + 1;
    });
  }

  // Referral reward counts per user (as referrer)
  let referralsByUser: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: refs } = await admin
      .from('referrals')
      .select('referrer_user_id, status')
      .in('referrer_user_id', userIds);
    (refs ?? []).forEach((row: { referrer_user_id: string; status: string }) => {
      if (!referralsByUser[row.referrer_user_id]) referralsByUser[row.referrer_user_id] = 0;
      if (row.status === 'rewarded') referralsByUser[row.referrer_user_id]++;
    });
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const enrichedUsers = (users ?? []).map((u: {
    id: string;
    email: string;
    name: string | null;
    plan_tier: string;
    created_at: string;
    onboarding_complete: boolean;
    selected_papers: string[] | null;
    referral_code: string | null;
    referred_by: string | null;
  }) => ({
    ...u,
    entitlementCount: entitlementsByUser[u.id] ?? 0,
    referralRewardCount: referralsByUser[u.id] ?? 0,
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
