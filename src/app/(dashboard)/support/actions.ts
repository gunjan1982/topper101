'use server';

import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { ROUTES } from '@/lib/routes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const allowedCategories = new Set(['payment', 'content', 'access', 'account', 'feature', 'other']);

export async function submitSupportRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const category = String(formData.get('category') ?? 'other');
  const subject = String(formData.get('subject') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!subject || !message) {
    redirect(`${ROUTES.support}?error=${encodeURIComponent('Please add a subject and message.')}`);
  }

  const { data: profile } = await supabase
    .from('users')
    .select('email, phone')
    .eq('id', user.id)
    .single();

  const { error } = await supabase.from('support_requests').insert({
    user_id: user.id,
    email: profile?.email ?? user.email ?? '',
    phone: profile?.phone ?? null,
    category: allowedCategories.has(category) ? category : 'other',
    subject,
    message,
  });

  if (error) {
    redirect(`${ROUTES.support}?error=${encodeURIComponent(error.message)}`);
  }

  await captureServerEvent(user.id, 'support_request_submitted', {
    category,
  });

  revalidatePath(ROUTES.support);
  redirect(`${ROUTES.support}?submitted=1`);
}
