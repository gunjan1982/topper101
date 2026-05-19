'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';

const statuses = new Set(['open', 'in_progress', 'resolved']);

export async function updateSupportRequest(formData: FormData) {
  const requestId = String(formData.get('request_id') ?? '');
  const status = String(formData.get('status') ?? 'open');
  const adminNotes = String(formData.get('admin_notes') ?? '').trim();

  if (!requestId || !statuses.has(status)) return;

  const admin = createAdminClient();
  await admin
    .from('support_requests')
    .update({
      status,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  revalidatePath(ROUTES.adminRequests);
}
