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

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email ?? '')) redirect(ROUTES.dashboard);
}

export async function updateUserPlanTier(targetUserId: string, newPlanTier: 'free' | 'pass' | 'pro') {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('users')
    .update({ plan_tier: newPlanTier })
    .eq('id', targetUserId);
  if (error) throw new Error(error.message);
  revalidatePath(ROUTES.adminUsers);
}

export async function grantAdminSubjectEntitlement(targetUserId: string, courseCode: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('user_entitlements').upsert({
    user_id: targetUserId,
    entitlement_type: 'subject_unlock',
    course_code: courseCode,
    source: 'admin',
    source_ref: null,
    expires_at: null,
    metadata: {},
  }, { onConflict: 'user_id,entitlement_type,course_code,source' });
  if (error) throw new Error(error.message);
  revalidatePath(ROUTES.adminUsers);
}

export async function revokeAdminSubjectEntitlement(targetUserId: string, courseCode: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('user_entitlements')
    .delete()
    .eq('user_id', targetUserId)
    .eq('entitlement_type', 'subject_unlock')
    .eq('course_code', courseCode)
    .eq('source', 'admin');
  if (error) throw new Error(error.message);
  revalidatePath(ROUTES.adminUsers);
}
