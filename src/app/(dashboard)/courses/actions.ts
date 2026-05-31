/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { canAccessCourse, fetchSubjectEntitlements, grantSubjectEntitlement } from '@/lib/entitlements';
import { captureServerEvent } from '@/lib/posthog-server';
import { revalidatePath } from 'next/cache';

type AnswerResult =
  | { status: 'success'; answer: string; creditsRemaining?: number; textbookGrounded?: boolean }
  | { status: 'paywall'; trigger: 'subject_locked' | 'credit_limit' }
  | { status: 'missing_answer' };

async function isFirstQuestionGroup(supabase: any, questionId: string, courseId: string): Promise<boolean> {
  try {
    // Fetch course code
    await supabase
      .from('courses')
      .select('code')
      .eq('id', courseId)
      .single();

    // Fetch topic clusters
    const { data: clusters } = await supabase
      .from('topic_clusters')
      .select('*')
      .eq('course_id', courseId)
      .order('frequency_count', { ascending: false });

    // Fetch all questions
    const { data: questionRows } = await supabase
      .from('questions')
      .select('*')
      .eq('course_id', courseId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (!questionRows || questionRows.length === 0) return false;

    const sessionOrder: Record<string, number> = { December: 2, June: 1 };
    
    function questionSessions(qs: any[]) {
      const sessions = new Map<string, { year: number; session: string }>();
      qs.forEach((q) => {
        if (!q.year || !q.session) return;
        const key = `${q.session}-${q.year}`;
        if (sessions.has(key)) return;
        sessions.set(key, { year: q.year, session: q.session });
      });
      return [...sessions.values()].sort((a, b) => b.year - a.year || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0));
    }

    function topicSessionStats(qs: any[]) {
      const sessions = new Map<string, { year: number; session: string; questionCount: number; totalMarks: number }>();
      qs.forEach((q) => {
        if (!q.year || !q.session) return;
        const key = `${q.session}-${q.year}`;
        const existing = sessions.get(key);
        if (existing) {
          existing.questionCount += 1;
          existing.totalMarks += q.marks;
        } else {
          sessions.set(key, { year: q.year, session: q.session, questionCount: 1, totalMarks: q.marks });
        }
      });
      return [...sessions.values()].sort((a, b) => b.year - a.year || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0));
    }

    const sessionFilters = questionSessions(questionRows);
    const topicSessions = new Map<string, any[]>();
    (clusters || []).forEach((cluster: any) => {
      const clusterQuestions = questionRows.filter((q: any) => q.topic_cluster_id === cluster.id || q.topic === cluster.cluster_name);
      topicSessions.set(cluster.id, topicSessionStats(clusterQuestions));
    });

    const getQuestionProbability = (q: any) => {
      const cluster = (clusters || []).find((c: any) => c.id === q.topic_cluster_id || c.cluster_name === q.topic);
      if (!cluster) return 0;
      const actualCount = topicSessions.get(cluster.id)?.length ?? 0;
      const total = sessionFilters.length || 1;
      return Math.min(100, Math.round((actualCount / total) * 100));
    };

    const groupRepeatedQuestions = (qs: any[]) => {
      const groups = new Map<string, any[]>();
      qs.forEach((q) => {
        const normalized = q.repeat_family_key;
        const key = normalized || q.id;
        groups.set(key, [...(groups.get(key) ?? []), q]);
      });

      return [...groups.values()].map((items) => {
        const sorted = [...items].sort((a, b) => b.marks - a.marks);
        return {
          question: sorted[0],
          variations: items,
        };
      });
    };

    const questionGroups = groupRepeatedQuestions(questionRows);
    const sortedQuestionGroups = [...questionGroups].sort((a, b) => {
      return getQuestionProbability(b.question) - getQuestionProbability(a.question);
    });

    if (sortedQuestionGroups.length === 0) return false;

    const firstGroup = sortedQuestionGroups[0];
    const isTargetInFirstGroup = firstGroup.variations.some((v: any) => v.id === questionId) || firstGroup.question.id === questionId;
    return isTargetInFirstGroup;
  } catch (err) {
    console.error('Error in isFirstQuestionGroup:', err);
    return false;
  }
}

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
  const isFirstQ = await isFirstQuestionGroup(supabase, questionId, (await supabase.from('questions').select('course_id').eq('id', questionId).single()).data?.course_id);
  const hasAccess = isFirstQ || canAccessCourse({
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

  // Check if it is the first question of the course (free)
  const isFirstQ = await isFirstQuestionGroup(supabase, questionId, question.course_id);

  const entitlements = await fetchSubjectEntitlements(supabase, user.id);
  const hasAccess = isFirstQ || canAccessCourse({
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

export async function unlockCourseWithCredits(courseCode: string, creditsToSpend: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User data not found');
  }

  const userCredits = userData.credits ?? 0;
  if (userCredits < creditsToSpend) {
    throw new Error(`Insufficient credits. You need ${creditsToSpend} credits to unlock this course.`);
  }

  await grantSubjectEntitlement({
    supabase,
    userId: user.id,
    courseCode,
    source: 'purchase',
    metadata: {
      reason: 'Unlocked with credits',
      credits_spent: creditsToSpend,
    },
  });

  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: userCredits - creditsToSpend })
    .eq('id', user.id);

  if (updateError) {
    throw new Error('Failed to update credit balance: ' + updateError.message);
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath(`/courses/${courseCode}`, 'layout');
  return { success: true };
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

export type ConceptNode = {
  id: string;
  name: string;
  definition: string | null;
  key_theorists: string[] | null;
  clinical_relevance: string | null;
  exam_relevance: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  sample_answer_hook: string | null;
  domain: string;
  layer: number;
};

/**
 * Fetch concept tree nodes linked to a given topic cluster.
 * Returns an empty array (not an error) when the pipeline hasn't been run yet.
 */
export async function getConceptsForCluster(topicClusterId: string): Promise<ConceptNode[]> {
  if (!topicClusterId) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('concept_tree')
    .select('id, name, definition, key_theorists, clinical_relevance, exam_relevance, sample_answer_hook, domain, layer')
    .eq('topic_cluster_id', topicClusterId)
    .order('layer');

  if (error) {
    // Silently return empty — column may not exist on older DB (pre-migration)
    return [];
  }

  return (data ?? []) as ConceptNode[];
}
