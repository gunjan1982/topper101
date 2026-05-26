import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readFile } from 'fs/promises';
import path from 'path';
import QuestionCard from './components/QuestionCard';
import CoursePdfPanels, { type PdfSessionItem } from './components/CoursePdfPanels';
import { courseByCode, type CourseCatalogItem } from '@/lib/courseCatalog';
import { daysUntilExam, formatExamDate, formatExamWeekday, getExamSchedule } from '@/lib/examSchedule';
import { canAccessCourse, fetchSubjectEntitlements } from '@/lib/entitlements';
import { cleanQuestionText, formatQuestionSession } from '@/lib/questionDisplay';
import { questionRepeatKey } from '@/lib/questionRepeatAlgorithm';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const sessionOrder: Record<string, number> = {
  December: 2,
  June: 1,
};

type TopicCluster = {
  id: string;
  cluster_name: string;
  frequency_count: number;
  frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW' | null;
};

type QuestionRow = {
  id: string;
  year: number | null;
  session: string | null;
  section: string | null;
  question_text: string;
  marks: number;
  answer_status?: string | null;
  ai_answer?: string | null;
  model_answer?: string | null;
  course_id?: string;
  topic_cluster_id?: string | null;
  topic?: string | null;
  repeat_family_key?: string | null;
  repeat_family_label?: string | null;
  study_hook_key?: string | null;
  study_hook_label?: string | null;
  repeat_algo_version?: string | null;
  created_at?: string | null;
  textbook_grounded?: boolean | null;
};

type QuestionGroup = {
  question: QuestionRow;
  variations: Array<{
    id: string;
    tee: string;
    section: string | null;
    marks: number;
    text: string;
  }>;
};

type ProgressRow = {
  question_id: string;
  status: 'reviewed' | 'bookmarked' | 'skipped';
};

type TopicSessionStat = {
  year: number;
  session: string;
  label: string;
  questionCount: number;
  meanMarks: number;
};

function questionSessions(questions: QuestionRow[]) {
  const sessions = new Map<string, { year: number; session: string; label: string }>();

  questions.forEach((question) => {
    if (!question.year || !question.session) return;

    const key = `${question.session}-${question.year}`;
    if (sessions.has(key)) return;

    sessions.set(key, {
      year: question.year,
      session: question.session,
      label: formatQuestionSession(question.session, question.year),
    });
  });

  return [...sessions.values()].sort((a, b) => (
    b.year - a.year || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0)
  ));
}

function topicSessionStats(questions: QuestionRow[]) {
  const sessions = new Map<string, TopicSessionStat & { totalMarks: number }>();

  questions.forEach((question) => {
    if (!question.year || !question.session) return;

    const key = `${question.session}-${question.year}`;
    const existing = sessions.get(key);

    if (existing) {
      existing.questionCount += 1;
      existing.totalMarks += question.marks;
      existing.meanMarks = existing.totalMarks / existing.questionCount;
      return;
    }

    sessions.set(key, {
      year: question.year,
      session: question.session,
      label: formatQuestionSession(question.session, question.year),
      questionCount: 1,
      totalMarks: question.marks,
      meanMarks: question.marks,
    });
  });

  return [...sessions.values()]
    .map((session) => ({
      year: session.year,
      session: session.session,
      label: session.label,
      questionCount: session.questionCount,
      meanMarks: session.meanMarks,
    }))
    .sort((a, b) => (
      b.year - a.year || (sessionOrder[b.session] ?? 0) - (sessionOrder[a.session] ?? 0)
    ));
}

function formatMeanMarks(meanMarks: number) {
  return Number.isInteger(meanMarks) ? `${meanMarks}` : meanMarks.toFixed(1);
}

function topicMeanMarks(questions: QuestionRow[]) {
  if (questions.length === 0) return null;
  return questions.reduce((sum, question) => sum + question.marks, 0) / questions.length;
}

type TextbookChunk = { page_start: number; text: string };

export type QuestionTextbookMatch = { page: number; text: string };

async function computeQuestionPageMap(
  questions: QuestionRow[],
  courseCode: string,
): Promise<Record<string, QuestionTextbookMatch>> {
  try {
    const chunksPath = path.join(process.cwd(), 'data', 'textbooks', courseCode, 'chunks.json');
    const raw = await readFile(chunksPath, 'utf-8');
    const chunks: TextbookChunk[] = JSON.parse(raw);
    if (chunks.length <= 1) return {};

    const STOP_WORDS = new Set([
      'about','above','after','again','against','their','there','these','those',
      'through','under','until','which','while','would','could','should','shall',
      'also','from','have','that','this','been','being','were','will','them',
      'then','they','what','when','where','each','more','most','other','some',
      'such','into','your','than','very','with','describe','explain','discuss',
      'define','elucidate','delineate','differentiate','elaborate',
    ]);

    // Build inverted index: word → [chunk indices]
    const wordIndex = new Map<string, number[]>();
    chunks.forEach((chunk, idx) => {
      const seen = new Set<string>();
      for (const w of chunk.text.toLowerCase().split(/\W+/)) {
        if (w.length > 4 && !STOP_WORDS.has(w) && !seen.has(w)) {
          seen.add(w);
          const list = wordIndex.get(w);
          if (list) list.push(idx); else wordIndex.set(w, [idx]);
        }
      }
    });

    const map: Record<string, QuestionTextbookMatch> = {};
    for (const q of questions) {
      const qWords = cleanQuestionText(q).toLowerCase().split(/\W+/)
        .filter((w) => w.length > 4 && !STOP_WORDS.has(w));
      if (!qWords.length) continue;
      const scores = new Map<number, number>();
      for (const word of qWords) {
        for (const idx of wordIndex.get(word) ?? []) {
          scores.set(idx, (scores.get(idx) ?? 0) + 1);
        }
      }
      let bestScore = 0; let bestIdx = 0;
      scores.forEach((score, idx) => {
        if (score > bestScore) { bestScore = score; bestIdx = idx; }
      });
      map[q.id] = { page: chunks[bestIdx].page_start, text: chunks[bestIdx].text };
    }
    return map;
  } catch {
    return {};
  }
}

function answerLength(question: QuestionRow) {
  return (question.ai_answer ?? question.model_answer ?? '').length;
}

function groupRepeatedQuestions(questions: QuestionRow[], courseCode: string) {
  const groups = new Map<string, QuestionRow[]>();

  questions.forEach((question) => {
    const normalized = question.repeat_family_key || questionRepeatKey({ ...question, course_code: courseCode });
    const key = normalized || question.id;
    groups.set(key, [...(groups.get(key) ?? []), question]);
  });

  return [...groups.values()].map((items): QuestionGroup => {
    const sorted = [...items].sort((a, b) => (
      answerLength(b) - answerLength(a)
      || b.marks - a.marks
      || cleanQuestionText(b).length - cleanQuestionText(a).length
    ));
    const question = sorted[0];

    return {
      question,
      variations: [...items]
        .sort((a, b) => (
          (b.year ?? 0) - (a.year ?? 0)
          || (sessionOrder[b.session ?? ''] ?? 0) - (sessionOrder[a.session ?? ''] ?? 0)
          || b.marks - a.marks
        ))
        .map((item) => ({
          id: item.id,
          tee: formatQuestionSession(item.session, item.year),
          section: item.section,
          marks: item.marks,
          text: cleanQuestionText(item),
        })),
    };
  });
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseCode: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { courseCode } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch course details
  const { data: dbCourse } = await supabase
    .from('courses')
    .select('*')
    .eq('code', courseCode)
    .single();

  const course = (dbCourse as CourseCatalogItem | null) ?? courseByCode(null, courseCode);

  if (!course) {
    notFound();
  }

  const hasDatabaseCourse = isUuid(course.id);
  const exam = getExamSchedule(course.code);
  const examDaysLeft = exam ? daysUntilExam(exam.date) : null;

  const { data: userData } = await supabase
    .from('users')
    .select('plan_tier, referral_code')
    .single();
  const userEmail = user?.email ?? null;
  const entitlements = user ? await fetchSubjectEntitlements(supabase, user.id) : [];
  const canAccessAnswers = canAccessCourse({
    planTier: userData?.plan_tier,
    courseCode: course.code,
    entitlements,
  });

  // Fetch topic clusters
  const { data: clusters } = hasDatabaseCourse
    ? await supabase
        .from('topic_clusters')
        .select('*')
        .eq('course_id', course.id)
        .order('frequency_count', { ascending: false })
    : { data: null };

  // Fetch all course questions once so filters and the visible list stay in sync.
  const query = hasDatabaseCourse
    ? supabase
        .from('questions')
        .select('*')
        .eq('course_id', course.id)
    : null;

  const { data: questionRows } = query
    ? await query.order('year', { ascending: false }).order('created_at', { ascending: false })
    : { data: [] };

  const allQuestions = (questionRows as QuestionRow[] | null) ?? [];
  const questionIds = allQuestions.map((question) => question.id);
  const { data: progressRows } = user && questionIds.length > 0
    ? await supabase
        .from('user_progress')
        .select('question_id, status')
        .eq('user_id', user.id)
        .in('question_id', questionIds)
    : { data: [] };
  const progressByQuestion = new Map<string, { reviewed: boolean; bookmarked: boolean }>();

  ((progressRows as ProgressRow[] | null) ?? []).forEach((row) => {
    if (row.status !== 'reviewed' && row.status !== 'bookmarked') return;

    const current = progressByQuestion.get(row.question_id) ?? { reviewed: false, bookmarked: false };
    current[row.status] = true;
    progressByQuestion.set(row.question_id, current);
  });

  const sessionFilters = questionSessions(allQuestions);
  const selectedYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : null;
  const selectedSession = resolvedSearchParams.session ?? null;
  const matchedCluster = (clusters as TopicCluster[] | null)?.find((cluster) => cluster.id === resolvedSearchParams.cluster);

  const questions = allQuestions.filter((question) => {
    if (selectedYear && question.year !== selectedYear) return false;
    if (selectedSession && question.session !== selectedSession) return false;
    if (!matchedCluster) return true;
    return question.topic_cluster_id === matchedCluster.id || question.topic === matchedCluster.cluster_name;
  });
  const questionGroups = groupRepeatedQuestions(questions, course.code);
  const questionPageMap = await computeQuestionPageMap(questions, course.code);
  const topicSessions = new Map<string, TopicSessionStat[]>();

  (clusters as TopicCluster[] | null)?.forEach((cluster) => {
    const clusterQuestions = allQuestions.filter((question) => (
      question.topic_cluster_id === cluster.id || question.topic === cluster.cluster_name
    ));
    topicSessions.set(cluster.id, topicSessionStats(clusterQuestions));
  });

  const coursePath = `/courses/${course.code}`;
  const clusterParam = resolvedSearchParams.cluster ? `&cluster=${resolvedSearchParams.cluster}` : '';
  const clearSessionHref = resolvedSearchParams.cluster ? `${coursePath}?cluster=${resolvedSearchParams.cluster}` : coursePath;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-950">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{course.code}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{course.code}</h1>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Year {course.year} {course.stream ? `· ${course.stream}` : ''}
            </span>
          </div>
          <p className="mt-2 text-xl text-zinc-600 dark:text-zinc-400">{course.name}</p>
          {exam && (
            <p className="mt-3 text-sm font-semibold text-teal-700 dark:text-teal-300">
              Exam: {formatExamWeekday(exam.date)}, {formatExamDate(exam.date)} · {exam.session} · {exam.startTime}-{exam.endTime}
              {examDaysLeft != null && examDaysLeft >= 0 ? ` · ${examDaysLeft} days left` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {course.course_type === 'theory' && hasDatabaseCourse && (
            <Link
              href={`/courses/${course.code}/assignments`}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-inset ring-zinc-200 hover:ring-teal-600/50 hover:text-teal-700 transition-all dark:bg-zinc-900 dark:ring-zinc-700 dark:text-zinc-400"
            >
              Assignments
            </Link>
          )}
          {hasDatabaseCourse && sessionFilters.length > 0 && (
            <a
              href={`/api/pdf/qpaper/${course.code}?year=${sessionFilters[0].year}&session=${encodeURIComponent(sessionFilters[0].session)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-inset ring-zinc-200 hover:ring-teal-600/50 hover:text-teal-700 transition-all dark:bg-zinc-900 dark:ring-zinc-700 dark:text-zinc-400"
            >
              📄 Q Paper
            </a>
          )}
          {course.course_type === 'theory' && hasDatabaseCourse && (
            <Link
              href={`/courses/${course.code}/mock-test`}
              className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
            >
              Mock Test
            </Link>
          )}
          <div className="text-sm font-medium text-zinc-500">
            {questionGroups.length} Question Patterns · {questions.length} Variations
          </div>
        </div>
      </div>

      {/* Heat Map Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Frequency Heat Map</h2>
          {resolvedSearchParams.cluster && (
            <Link href={`/courses/${course.code}`} className="text-xs font-bold text-teal-700">Clear Filter</Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clusters && clusters.length > 0 ? (
            (clusters as TopicCluster[]).map((cluster) => {
              const sessions = topicSessions.get(cluster.id) ?? [];
              const visibleSessions = sessions.slice(0, 4);
              const hiddenCount = Math.max(0, sessions.length - visibleSessions.length);
              const clusterQuestions = allQuestions.filter((question) => (
                question.topic_cluster_id === cluster.id || question.topic === cluster.cluster_name
              ));
              const meanMarks = topicMeanMarks(clusterQuestions);

              return (
                <Link
                  key={cluster.id} 
                  href={`/courses/${course.code}?cluster=${cluster.id}`}
                  className={`group rounded-2xl border p-5 transition-all hover:shadow-md hover:border-teal-600/50 ${
                    resolvedSearchParams.cluster === cluster.id ? 'ring-2 ring-teal-700 ring-offset-2' : ''
                  } ${
                    cluster.frequency_tier === 'HIGH' 
                      ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' 
                      : cluster.frequency_tier === 'MEDIUM'
                      ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10'
                      : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        cluster.frequency_tier === 'HIGH' ? 'text-red-600' : cluster.frequency_tier === 'MEDIUM' ? 'text-amber-600' : 'text-zinc-500'
                      }`}>
                        {cluster.frequency_tier ?? 'LOW'} Tier
                      </span>
                      {cluster.frequency_tier === 'HIGH' && <span className="text-sm">🔥</span>}
                    </div>
                    <span className="text-xs font-medium text-zinc-500">
                      {sessions.length || cluster.frequency_count} TEEs
                    </span>
                  </div>
                  <h3 className="font-bold group-hover:text-teal-700 transition-colors dark:text-white">{cluster.cluster_name}</h3>
                  {meanMarks !== null && (
                    <div className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Mean {formatMeanMarks(meanMarks)} Marks
                    </div>
                  )}
                  {visibleSessions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {visibleSessions.map((session) => (
                        <span
                          key={`${cluster.id}-${session.session}-${session.year}`}
                          title={`${cluster.cluster_name} appeared in ${session.label}`}
                          className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-zinc-600 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-950/50 dark:text-zinc-300 dark:ring-zinc-800"
                        >
                          {session.label}
                        </span>
                      ))}
                      {hiddenCount > 0 && (
                        <span className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-zinc-500 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-950/50 dark:ring-zinc-800">
                          +{hiddenCount}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800">
              No frequency data available for this course yet.
            </div>
          )}
        </div>
      </section>

      {/* Question List Section */}
      <section className="space-y-6">
        <div className="sticky top-[73px] z-30 flex flex-wrap items-center gap-4 bg-zinc-50/80 py-4 backdrop-blur-md dark:bg-black/80">
          <h2 className="text-lg font-bold dark:text-white">
            {resolvedSearchParams.cluster ? 'Filtered Questions' : 'Past Paper Questions'}
          </h2>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
            {sessionFilters.length > 0 && (
              <Link
                href={clearSessionHref}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  !selectedYear && !selectedSession ? 'bg-teal-700 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
                }`}
              >
                All sessions
              </Link>
            )}
            {sessionFilters.map((item) => {
              const active = selectedYear === item.year && selectedSession === item.session;
              return (
                <Link
                  key={`${item.session}-${item.year}`}
                  href={`${coursePath}?year=${item.year}&session=${encodeURIComponent(item.session)}${clusterParam}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    active ? 'bg-teal-700 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {/* Q Paper link — redundant; replaced by floating drawer toggle in CoursePdfPanels */}
        </div>

        {/* Single-column layout — PDF panels float as a drawer (see CoursePdfPanels) */}
        <div className="space-y-4">
            {questionGroups.length > 0 ? (
              questionGroups.map(({ question: q, variations }) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  variations={variations}
                  courseCode={course.code}
                  isPaid={canAccessAnswers}
                  referralCode={userData?.referral_code ?? null}
                  userEmail={userEmail}
                  frequencyTier={
                    (clusters as TopicCluster[] | null)?.find((cluster) => cluster.id === q.topic_cluster_id || cluster.cluster_name === q.topic)?.frequency_tier ?? 'LOW'
                  }
                  initialProgress={progressByQuestion.get(q.id)}
                  textbookPage={questionPageMap[q.id]?.page}
                  textbookExcerpt={questionPageMap[q.id]?.text}
                  topicClusterId={q.topic_cluster_id ?? undefined}
                  textbookGrounded={q.textbook_grounded ?? false}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 p-20 text-center dark:border-zinc-800">
                <p className="text-zinc-500 font-medium italic">
                  {hasDatabaseCourse
                    ? 'No questions found matching your filters.'
                    : 'This paper is in your study map, but question data has not been loaded in the database yet.'}
                  <br/>
                  <Link href={`/courses/${course.code}`} className="mt-2 inline-block text-teal-700 underline">Clear all filters</Link>
                </p>
              </div>
            )}
          </div>

          {/* Floating drawer with Q Paper + Textbook excerpt — toggleable from right edge */}
          <CoursePdfPanels
            courseCode={course.code}
            sessionFilters={sessionFilters as PdfSessionItem[]}
            initialYear={selectedYear}
            initialSession={selectedSession}
            questionPageMap={questionPageMap}
          />
      </section>
    </div>
  );
}
