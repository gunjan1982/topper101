'use server';

import { createClient } from '@/lib/supabase/server';

export type QuestionSlot = {
  question_id: string;
  question_text: string;
  section: 'A' | 'B' | 'C';
  marks: number;
};

export type Answer = {
  question_id: string;
  answer_text: string;
  self_grade: 'strong' | 'adequate' | 'needs_work' | null;
};

export async function saveMockAttempt(
  courseId: string,
  questions: QuestionSlot[],
  answers: Answer[],
  timeTakenSeconds: number,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mock_test_attempts')
    .insert({
      user_id: user.id,
      course_id: courseId,
      questions,
      answers,
      completed_at: new Date().toISOString(),
      time_taken_seconds: timeTakenSeconds,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to save mock attempt');
  return data.id;
}

export async function updateMockAttemptGrades(
  attemptId: string,
  answers: Answer[],
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('mock_test_attempts')
    .update({ answers })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

