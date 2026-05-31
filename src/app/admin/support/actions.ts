'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function isAdmin(email?: string): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? '';
  const adminEmails = new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));
  return adminEmails.has(email.toLowerCase());
}

export type ActionResponse = 
  | { success: true }
  | { error: string };

export async function updateSupportRequest(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return { error: 'Unauthorized. Administrative privileges required.' };
    }

    const requestId = String(formData.get('request_id') ?? '');
    const status = String(formData.get('status') ?? '').trim();
    const adminNotes = String(formData.get('admin_notes') ?? '').trim();

    if (!requestId) {
      return { error: 'Request ID is required.' };
    }

    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return { error: `Invalid status: ${status}` };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('support_requests')
      .update({
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating support request:', error);
      return { error: error.message };
    }

    revalidatePath('/admin/support');
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred.' };
  }
}

import { redirect } from 'next/navigation';

export async function updateSupportRequestForm(formData: FormData): Promise<void> {
  const result = await updateSupportRequest(formData);
  if ('error' in result) {
    redirect(`/admin/support?error=${encodeURIComponent(result.error)}`);
  } else {
    redirect(`/admin/support?success=1`);
  }
}
