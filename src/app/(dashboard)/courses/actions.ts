'use server';

import { createClient } from '@/lib/supabase/server';
import { captureServerEvent } from '@/lib/posthog-server';
import { revalidatePath } from 'next/cache';

export async function getAnswer(questionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Fetch user credit info and plan
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan_tier, free_credits_used')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User data not found');
  }

  // Fetch question details
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    throw new Error('Question not found');
  }

  // Business Logic: Check Access
  
  // 1. Paid users get everything
  if (userData.plan_tier !== 'free') {
    return { answer: question.ai_answer, status: 'success' };
  }

  // 2. Free users check credits
  if (userData.free_credits_used < 5) {
    // Increment credits used
    await supabase
      .from('users')
      .update({ free_credits_used: userData.free_credits_used + 1 })
      .eq('id', user.id);
    
    revalidatePath('/dashboard', 'layout');
    return { 
      answer: question.ai_answer, 
      status: 'success', 
      creditsRemaining: 5 - (userData.free_credits_used + 1) 
    };
  }

  // 3. Free users at limit: Paywall
  return { status: 'paywall', trigger: 'credit_limit' };
}

export async function updateProgress(questionId: string, status: 'reviewed' | 'bookmarked' | 'skipped') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      question_id: questionId,
      status,
      reviewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_id' });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard', 'layout');
}

export async function submitFlag(questionId: string, flagType: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Insert the flag
  const { error } = await supabase
    .from('content_flags')
    .insert({
      user_id: user.id,
      question_id: questionId,
      flag_type: flagType,
      description,
    });

  if (error) {
    throw new Error(error.message);
  }

  // Count total flags for this question
  const { count } = await supabase
    .from('content_flags')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', questionId);

  // Auto-set under_review if 3+ flags
  if (count !== null && count >= 3) {
    await supabase
      .from('questions')
      .update({ answer_status: 'under_review' })
      .eq('id', questionId);
    
    revalidatePath(`/courses`, 'layout');
  }

  // PostHog event
  await captureServerEvent(user.id, 'content_flagged', {
    question_id: questionId,
    flag_type: flagType,
  });
}
