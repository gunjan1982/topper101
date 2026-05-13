'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateSettings({
  year,
  stream,
  papers,
}: {
  year: number;
  stream: string | null;
  papers: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const updateData: Record<string, unknown> = {
    year,
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
