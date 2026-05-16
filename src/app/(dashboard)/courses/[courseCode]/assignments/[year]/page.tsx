import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AssignmentQuestionCard from './AssignmentQuestionCard';

type AssignmentQuestion = {
  question_text: string;
  marks: number;
  block_ref?: string | null;
  chapter_ref?: string | null;
  page_ref?: string | null;
};

type CachedAssignmentAnswer = {
  answer_text: string;
  word_count: number;
};

export default async function AssignmentYearPage({
  params,
}: {
  params: Promise<{ courseCode: string; year: string }>;
}) {
  const { courseCode, year } = await params;
  const supabase = await createClient();

  // Active User session scope extraction + Tier mapping
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }
  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier')
    .eq('id', user.id)
    .single();

  const userPlanTier = (userData?.plan_tier as 'free' | 'pass' | 'pro') || 'free';
  const targetYear = parseInt(year);

  // 1. Resolve primary active table values mapping CourseCode & Target Year combinations
  const { data: courseData } = await supabase
    .from('courses')
    .select('id, name, code')
    .eq('code', courseCode)
    .single();

  if (!courseData) {
    notFound();
  }

  const { data: assignmentData } = await supabase
    .from('assignments')
    .select('id, questions')
    .eq('course_id', courseData.id)
    .eq('year', targetYear)
    .single();

  if (!assignmentData) {
    // Graceful explicit exit mapping if user tries traversing out-of-bounds parameters
    notFound();
  }

  const questionsArray = (assignmentData.questions as AssignmentQuestion[] | null) || [];

  // Query Assignment cached generation data directly avoiding expensive nested loop calls
  const { data: cachedAnswersPayload } = await supabase
    .from('assignment_answers')
    .select('question_index, content')
    .eq('user_id', user.id)
    .eq('assignment_id', assignmentData.id);

  // Map into O(1) format
  const preFetchedAnswers: Record<number, CachedAssignmentAnswer> = {};
  if (cachedAnswersPayload) {
    cachedAnswersPayload.forEach((row) => {
      preFetchedAnswers[row.question_index] = row.content as CachedAssignmentAnswer;
    });
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Structuring */}
      <nav className="flex text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-950 dark:hover:text-zinc-300">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseData.code}`} className="hover:text-zinc-950 dark:hover:text-zinc-300">{courseData.code}</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseData.code}/assignments`} className="hover:text-zinc-950 dark:hover:text-zinc-300">Assignments</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{targetYear}–{targetYear + 1}</span>
      </nav>

      {/* Hero Display Element */}
      <div>
        <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">IGNOU Assignment {targetYear}</h1>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/40">
              {courseData.code}
            </span>
        </div>
        <p className="mt-2 text-xl text-zinc-600 dark:text-zinc-400">
          Model answers and reference pages for the {courseData.name} assignment.
        </p>
      </div>

      {/* Mapped Assignments array displaying distinct cards mapping cached payload explicitly downwards */}
      <div className="space-y-6">
        {questionsArray.map((q, index) => (
          <AssignmentQuestionCard 
            key={index}
            question={q}
            questionIndex={index}
            assignmentId={assignmentData.id}
            userPlanTier={userPlanTier}
            courseCode={courseData.code}
            assignmentYear={targetYear}
            existingAnswer={preFetchedAnswers[index] || null}
          />
        ))}
        {questionsArray.length === 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-16 text-center dark:border-zinc-800">
            <p className="text-zinc-500 font-medium">No valid assigned questions found attached to this document segment.</p>
          </div>
        )}
      </div>

    </div>
  );
}
