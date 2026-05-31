'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';

export async function submitQueryBox(formData: FormData) {
  const email = formData.get('email') as string | null;
  const message = formData.get('message') as string | null;
  const category = formData.get('category') as string | null;

  if (!message || message.trim().length === 0) {
    return { error: 'Please enter a message.' };
  }

  // Get active user if logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let finalEmail = '';
  let finalUserId: string | null = null;
  let finalPhone: string | null = null;

  if (user) {
    finalEmail = user.email ?? '';
    finalUserId = user.id;
    // Load profile to check for phone
    const { data: profile } = await supabase
      .from('users')
      .select('email, phone')
      .eq('id', user.id)
      .single();
    if (profile?.phone) {
      finalPhone = profile.phone;
    }
  } else {
    if (!email || email.trim().length === 0) {
      return { error: 'Please enter your email so we can respond.' };
    }
    finalEmail = email.trim();
  }

  const admin = createAdminClient();
  const { error } = await admin.from('support_requests').insert({
    user_id: finalUserId,
    email: finalEmail,
    phone: finalPhone,
    category: category || 'other',
    subject: `Sidebar Query: ${message.slice(0, 40)}${message.length > 40 ? '...' : ''}`,
    message: message.trim(),
    status: 'open',
    priority: 'normal'
  });

  if (error) {
    console.error('Error inserting sidebar query:', error);
    return { error: error.message };
  }

  if (finalUserId) {
    await captureServerEvent(finalUserId, 'support_request_submitted', {
      category: category || 'other',
      source: 'sidebar_query_box'
    });
  }

  return { success: true };
}
