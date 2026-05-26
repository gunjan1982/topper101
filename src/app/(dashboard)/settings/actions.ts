'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { captureServerEvent } from '@/lib/posthog-server';

export async function updateSettings({
  year,
  stream,
  phone,
  papers,
}: {
  year: number;
  stream: string | null;
  phone: string;
  papers: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const updateData: Record<string, unknown> = {
    year,
    phone: phone.trim() || null,
    selected_papers: papers,
  };

  // Only set stream for Year 2; clear it for Year 1
  if (year === 2 && stream) {
    updateData.stream = stream;
  } else {
    updateData.stream = null;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard');
}

export async function setUrnaOptIn(value: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('users')
    .update({ urna_opt_in: value })
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  if (value) {
    await captureServerEvent(user.id, 'urna_interest_expressed', { email: user.email });
  }

  revalidatePath('/settings');
}
