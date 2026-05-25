'use server';

import { createClient } from '@/lib/supabase/server';
import { canAccessCourse, fetchSubjectEntitlements } from '@/lib/entitlements';
import { captureServerEvent } from '@/lib/posthog-server';
import { revalidatePath } from 'next/cache';

type AnswerResult =
  | { status: 'success'; answer: string; creditsRemaining?: number; textbookGrounded?: boolean }
  | { status: 'paywall'; trigger: 'subject_locked' | 'credit_limit' }
  | { status: 'missing_answer' };

async function recordQuestionEvent({
  supabase,
  userId,
  questionId,
  courseCode,
  eventType,
  accessState,
  planTier,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  questionId: string;
  courseCode: string;
  eventType: 'question_viewed' | 'answer_viewed';
  accessState: 'free' | 'paid';
  planTier: string | null;
}) {
  await supabase.from('user_question_events').upsert({
    user_id: userId,
    question_id: questionId,
    course_code: courseCode,
    event_type: eventType,
    access_state: accessState,
    plan_tier: planTier,
  }, { onConflict: 'user_id,question_id,event_type,access_state' });
}

export async function trackQuestionViewed(questionId: string, courseCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', user.id)
    .single();

  const entitlements = await fetchSubjectEntitlements(supabase, user.id);
  const hasAccess = canAccessCourse({
    planTier: userData?.plan_tier,
    courseCode,
    entitlements,
  });

  await recordQuestionEvent({
    supabase,
    userId: user.id,
    questionId,
    courseCode,
    eventType: 'question_viewed',
    accessState: hasAccess ? 'paid' : 'free',
    planTier: userData?.plan_tier ?? null,
  });
}

export async function getAnswer(questionId: string): Promise<AnswerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Fetch user credit info and plan
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User data not found');
  }

  // Fetch question details
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*, courses(code)')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    throw new Error('Question not found');
  }

  const answer = question.ai_answer ?? question.model_answer;
  if (!answer) {
    return { status: 'missing_answer' };
  }

  const courseCode = question.courses?.code;
  if (!courseCode) {
    throw new Error('Question course not found');
  }

  const entitlements = await fetchSubjectEntitlements(supabase, user.id);
  const hasAccess = canAccessCourse({
    planTier: userData.plan_tier,
    courseCode,
    entitlements,
  });

  if (!hasAccess) {
    return { status: 'paywall', trigger: 'subject_locked' };
  }

  await recordQuestionEvent({
    supabase,
    userId: user.id,
    questionId,
    courseCode,
    eventType: 'answer_viewed',
    accessState: hasAccess ? 'paid' : 'free',
    planTier: userData.plan_tier,
  });
  
  revalidatePath('/dashboard', 'layout');
  return { answer, status: 'success', textbookGrounded: question.textbook_grounded ?? false };
}

export async function updateProgress(questionId: string, status: 'reviewed' | 'bookmarked' | 'skipped', active = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = active
    ? await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          question_id: questionId,
          status,
          reviewed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,question_id,status' })
    : await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .eq('status', status);

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
      flag_type: flagType.toLowerCase().replace('factual ', ''),
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
