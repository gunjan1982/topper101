'use server';

import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateYear(year: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, year },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  
  if (year === 2) {
    redirect('/onboarding/stream');
  } else {
    // For Year 1, we skip stream selection
    redirect('/onboarding/papers');
  }
}

export async function updateStream(stream: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email!, stream },
      { onConflict: 'id' }
    );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/onboarding', 'layout');
  redirect('/onboarding/papers');
}

export async function completeOnboarding(
  papers: string[],
  meta?: { year: number; stream: string | null; startedAt: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('users')
    .update({ 
      selected_papers: papers,
      onboarding_complete: true 
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(error.message);
  }

  // PostHog: onboarding_completed
  const timeToComplete = meta?.startedAt
    ? Math.round((Date.now() - meta.startedAt) / 1000)
    : null;

  await captureServerEvent(user.id, 'onboarding_completed', {
    year: meta?.year ?? null,
    stream: meta?.stream ?? null,
    papers_selected: papers,
    time_to_complete: timeToComplete,
  });

  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard');
}
