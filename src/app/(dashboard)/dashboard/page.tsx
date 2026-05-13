import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user data including onboarding status and selected papers
  const { data: userData } = await supabase
    .from('users')
    .select('name, onboarding_complete, selected_papers, plan_tier')
    .eq('id', user.id)
    .single();

  if (!userData?.onboarding_complete) {
    redirect('/onboarding/year');
  }

  const selectedPapers: string[] = (userData.selected_papers as string[]) ?? [];

  // Guard: if onboarding marked complete but no papers selected, send back to pick papers
  if (selectedPapers.length === 0) {
    redirect('/onboarding/papers');
  }

  // Fetch course details for selected papers
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, code, name')
    .in('code', selectedPapers);



  // Batch-fetch progress for all selected courses in a single query
  // We join via questions: user_progress → questions → courses
  const courseIds = courses?.map((c) => c.id) ?? [];

  // Count reviewed and bookmarked per course
  type ProgressRow = {
    question_id: string;
    status: string;
    questions: { course_id: string } | null;
  };

  let progressByCourse: Record<string, { reviewed: number; bookmarked: number }> = {};
  let totalsByCourse: Record<string, number> = {};

  if (courseIds.length > 0) {
    // Reviewed + bookmarked counts
    const { data: progressRows } = await supabase
      .from('user_progress')
      .select('question_id, status, questions!inner(course_id)')
      .eq('user_id', user.id)
      .in('questions.course_id', courseIds) as { data: ProgressRow[] | null };

    (progressRows ?? []).forEach((row) => {
      const courseId = row.questions?.course_id;
      if (!courseId) return;
      if (!progressByCourse[courseId]) {
        progressByCourse[courseId] = { reviewed: 0, bookmarked: 0 };
      }
      if (row.status === 'reviewed') progressByCourse[courseId].reviewed++;
      if (row.status === 'bookmarked') progressByCourse[courseId].bookmarked++;
    });

    // Total question count per course
    const { data: totalRows } = await supabase
      .from('questions')
      .select('course_id')
      .in('course_id', courseIds);

    (totalRows ?? []).forEach((row) => {
      totalsByCourse[row.course_id] = (totalsByCourse[row.course_id] ?? 0) + 1;
    });
  }

  // Overall stats
  const totalReviewed = Object.values(progressByCourse).reduce((s, p) => s + p.reviewed, 0);

  // Days until June TEE
  const examDate = new Date('2026-06-01');
  const today = new Date();
  const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">
          Welcome back{userData.name ? `, ${userData.name}` : ''}.
        </h1>
        <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">
          {daysLeft > 0 ? `${daysLeft} days until June TEE.` : 'June TEE has started!'}
        </p>
      </div>

      {/* Upgrade Banner for free users */}
      {userData.plan_tier === 'free' && (
        <div className="relative overflow-hidden rounded-3xl bg-teal-700 p-8 text-white shadow-xl shadow-teal-700/20">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Unlock the full question bank</h2>
              <p className="mt-1 opacity-90">Get AI model answers for all questions and see the frequency heat map.</p>
            </div>
            <Link 
              href="/pricing" 
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-teal-700 hover:bg-zinc-100 transition-all active:scale-95"
            >
              Upgrade to Topper Pass ₹299
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Questions Reviewed', value: String(totalReviewed), icon: '✅' },
          { label: 'AI Answers Read', value: '0', icon: '🤖' },
          { label: 'Study Streak', value: '0 days', icon: '🔥' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="text-3xl">{stat.icon}</div>
            <div>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</div>
              <div className="text-2xl font-bold dark:text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Paper Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-white">Your Papers</h2>
        {(!courses || courses.length === 0) ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">No courses found for your selected papers.</p>
            <Link href="/onboarding/papers" className="mt-4 inline-block rounded-full bg-teal-700 px-6 py-2 text-sm font-bold text-white hover:bg-teal-600">
              Re-select Papers
            </Link>
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => {
            const progress = progressByCourse[course.id] ?? { reviewed: 0, bookmarked: 0 };
            const total = totalsByCourse[course.id] ?? 0;
            const pct = total > 0 ? Math.round((progress.reviewed / total) * 100) : 0;

            return (
              <div key={course.code} className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-teal-700/50 transition-all dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30">
                    {course.code}
                  </div>
                  <div className="text-xs font-medium text-zinc-400">{pct}% reviewed</div>
                </div>
                <h3 className="mt-4 text-xl font-bold leading-tight dark:text-white group-hover:text-teal-700 transition-colors">
                  {course.name}
                </h3>

                {/* Progress Bar */}
                <div className="mt-5 space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {total > 0
                        ? `${progress.reviewed} of ${total} reviewed`
                        : 'No questions yet'}
                    </span>
                    {progress.bookmarked > 0 && (
                      <span className="flex items-center gap-1">
                        🔖 {progress.bookmarked} bookmarked
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <Link 
                    href={`/courses/${course.code}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-600"
                  >
                    Study Now
                    <span className="text-lg">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
