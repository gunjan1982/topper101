'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function unlockConceptTree(courseCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Fetch credits
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User data not found');
  }

  const userCredits = userData.credits ?? 0;
  if (userCredits < 1) {
    throw new Error('Insufficient credits. You need 1 credit to unlock this subject\'s concept tree.');
  }

  // Deduct 1 credit
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: userCredits - 1 })
    .eq('id', user.id);

  if (updateError) {
    throw updateError;
  }

  // Grant concept_tree_unlock entitlement
  const { error: grantError } = await supabase
    .from('user_entitlements')
    .insert({
      user_id: user.id,
      entitlement_type: 'concept_tree_unlock',
      course_code: courseCode,
      source: 'purchase',
      metadata: {
        reason: 'Unlocked subject concept tree with credits',
        credits_spent: 1,
      },
    });

  if (grantError) {
    // Rollback credit deduction
    await supabase.from('users').update({ credits: userCredits }).eq('id', user.id);
    throw grantError;
  }

  revalidatePath('/concepts');
  return { success: true };
}
