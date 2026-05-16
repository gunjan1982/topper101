'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? '';
  const admins = new Set(raw.split(',').map((e) => e.trim().toLowerCase()));
  return admins.has(email.toLowerCase());
}

export async function updateUserPlanTier(targetUserId: string, newPlanTier: 'free' | 'pass' | 'pro') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email ?? '')) {
    redirect(ROUTES.dashboard);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('users')
    .update({ plan_tier: newPlanTier })
    .eq('id', targetUserId);

  if (error) throw new Error(error.message);

  revalidatePath(ROUTES.adminUsers);
}
