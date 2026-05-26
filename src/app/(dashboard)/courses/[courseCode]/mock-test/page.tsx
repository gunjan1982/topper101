import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { courseByCode } from '@/lib/courseCatalog';
import { canAccessCourse, fetchSubjectEntitlements } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import MockTestRunner from './MockTestRunner';

type TopicCluster = {
  id: string;
  frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW' | null;
};

type QuestionRow = {
  id: string;
  question_text: string;
  section: string;
  marks: number;
  ai_answer: string | null;
  course_id: string;
  topic_cluster_id: string | null;
};

type SectionKey = 'A' | 'B' | 'C';

type MockQuestion = {
  question_id: string;
  question_text: string;
  section: SectionKey;
  marks: number;
  ai_answer: string | null;
};

function shuffleSlice<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function assemblePaper(
  questions: QuestionRow[],
  tierMap: Map<string, 'HIGH' | 'MEDIUM' | 'LOW' | null>,
): { A: MockQuestion[]; B: MockQuestion[]; C: MockQuestion[] } {
  const byTier = (tiers: Array<'HIGH' | 'MEDIUM' | 'LOW' | null>) =>
    questions.filter((q) => tiers.includes(tierMap.get(q.topic_cluster_id ?? '') ?? null));

  const highQ = byTier(['HIGH']);
  const medHighQ = byTier(['HIGH', 'MEDIUM']);
  const anyQ = questions;

  // Section A: 5 questions, 10 marks each — prefer HIGH tier
  const secAPool = highQ.length >= 5 ? highQ : anyQ;
  const secA = shuffleSlice(secAPool, 5);

  // Section B: 8 questions, 6 marks each — prefer MEDIUM/HIGH
  const usedIds = new Set(secA.map((q) => q.id));
  const secBPool = (medHighQ.length >= 8 ? medHighQ : anyQ).filter((q) => !usedIds.has(q.id));
  const secB = shuffleSlice(secBPool.length >= 8 ? secBPool : anyQ.filter((q) => !usedIds.has(q.id)), 8);
  secB.forEach((q) => usedIds.add(q.id));

  // Section C: 10 questions, 3 marks each — any tier, not already used
  const secCPool = anyQ.filter((q) => !usedIds.has(q.id));
  const secC = shuffleSlice(secCPool, Math.min(10, secCPool.length));

  const toMockQ = (q: QuestionRow, sec: SectionKey): MockQuestion => ({
    question_id: q.id,
    question_text: q.question_text,
    section: sec,
    marks: q.marks,
    ai_answer: q.ai_answer,
  });

  return {
    A: secA.map((q) => toMockQ(q, 'A')),
    B: secB.map((q) => toMockQ(q, 'B')),
    C: secC.map((q) => toMockQ(q, 'C')),
  };
}

export default async function MockTestPage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(ROUTES.login);

  // Fetch course
  const { data: dbCourse } = await supabase
    .from('courses')
    .select('*')
    .eq('code', courseCode)
    .single();

  const course = dbCourse ?? courseByCode(null, courseCode);
  if (!course) notFound();

  // Access control
  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier')
    .single();
  const entitlements = await fetchSubjectEntitlements(supabase, user.id);
  const hasAccess = canAccessCourse({
    planTier: userData?.plan_tier,
    courseCode: course.code,
    entitlements,
  });

  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <nav className="flex text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-950">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href={`/courses/${courseCode}`} className="hover:text-zinc-950">{courseCode}</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-950 dark:text-zinc-50">Mock Test</span>
        </nav>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-10 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold dark:text-white">Mock Tests are a paid feature</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Unlock {courseCode} to take timed mock tests with model-answer review and self-grading.
          </p>
          <Link
            href={ROUTES.pricing}
            className="inline-block mt-2 rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-700 transition-colors"
          >
            Unlock this subject →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch questions and their clusters
  const { data: questionRows } = await supabase
    .from('questions')
    .select('id, question_text, section, marks, ai_answer, course_id, topic_cluster_id')
    .eq('course_id', course.id)
    .order('marks', { ascending: false });

  const questions = (questionRows as QuestionRow[] | null) ?? [];

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <nav className="flex text-sm text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-950">Dashboard</Link>
          <span className="mx-2">/</span>
          <Link href={`/courses/${courseCode}`} className="hover:text-zinc-950">{courseCode}</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-950 dark:text-zinc-50">Mock Test</span>
        </nav>
        <p className="text-zinc-500 dark:text-zinc-400">No questions available for this course yet.</p>
      </div>
    );
  }

  // Fetch clusters to build the frequency tier map
  const clusterIds = [...new Set(questions.map((q) => q.topic_cluster_id).filter(Boolean))] as string[];
  const { data: clusterRows } = clusterIds.length > 0
    ? await supabase
        .from('topic_clusters')
        .select('id, frequency_tier')
        .in('id', clusterIds)
    : { data: [] };

  const tierMap = new Map<string, 'HIGH' | 'MEDIUM' | 'LOW' | null>(
    ((clusterRows as TopicCluster[] | null) ?? []).map((c) => [c.id, c.frequency_tier]),
  );

  const sections = assemblePaper(questions, tierMap);

  return (
    <div className="space-y-8">
      <nav className="flex text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-950">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseCode}`} className="hover:text-zinc-950">{courseCode}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-950 dark:text-zinc-50">Mock Test</span>
      </nav>

      <MockTestRunner
        courseId={course.id}
        courseCode={course.code}
        courseName={course.name}
        sections={sections}
      />
    </div>
  );
}
