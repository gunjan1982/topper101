import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { courseByCode, type CourseCatalogItem } from '@/lib/courseCatalog';
import { canAccessCourse, fetchSubjectEntitlements, unlockedCourseCodes } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import { daysUntilExam, formatExamDate, formatExamWeekday, getExamSchedule, nextScheduledExam } from '@/lib/examSchedule';
import CopyReferralLink from '@/components/CopyReferralLink';
import ReferralDashboard from './ReferralDashboard';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const paymentSuccess = resolvedSearchParams.payment === 'success';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // Fetch user data including onboarding status and selected papers
  const { data: userData } = await supabase
    .from('users')
    .select('name, onboarding_complete, selected_papers, plan_tier, referral_code')
    .eq('id', user.id)
    .single();

  if (!userData?.onboarding_complete) {
    redirect(ROUTES.onboardingYear);
  }

  const selectedPapers: string[] = (userData.selected_papers as string[]) ?? [];
  const entitlements = await fetchSubjectEntitlements(supabase, user.id);
  const unlockedCourses = unlockedCourseCodes(entitlements);

  // Guard: if onboarding marked complete but no papers selected, send back to pick papers
  if (selectedPapers.length === 0) {
    redirect(ROUTES.onboardingPapers);
  }

  // Guard: free users who haven't picked their free subject yet
  if (userData.plan_tier === 'free' && entitlements.length === 0) {
    redirect(ROUTES.onboardingFreeSubject);
  }

  // Fetch course details for selected papers
  const { data: dbCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, code, name, year, stream, course_type')
    .in('code', selectedPapers);

  if (coursesError) {
    console.error('Error fetching dashboard courses:', coursesError);
  }

  const courses = selectedPapers
    .map((code) => courseByCode((dbCourses as CourseCatalogItem[] | null) ?? [], code))
    .filter((course): course is CourseCatalogItem => Boolean(course));

  // Batch-fetch progress for all selected courses in a single query
  // We join via questions: user_progress → questions → courses
  const courseIds = courses.map((course) => course.id).filter(isUuid);

  // Count reviewed and bookmarked per course
  type ProgressRow = {
    question_id: string;
    status: string;
    questions: { course_id: string } | null;
  };

  const progressByCourse: Record<string, { reviewed: number; bookmarked: number }> = {};
  const totalsByCourse: Record<string, number> = {};

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
  const totalBookmarked = Object.values(progressByCourse).reduce((s, p) => s + p.bookmarked, 0);
  const papersUnlocked = unlockedCourses.size;

  const nextExam = nextScheduledExam(selectedPapers);
  const nextExamCourse = nextExam ? courseByCode(courses, nextExam.courseCode) : null;
  const nextExamDaysLeft = nextExam ? daysUntilExam(nextExam.date) : null;

  // Fetch referrals for current user
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      status,
      created_at,
      referred_user:referred_user_id (
        email
      )
    `)
    .eq('referrer_user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-10">
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-teal-950/30 animate-fade-in">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🎉</span>
            <div>
              <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Payment successful!</h2>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                Your Topper Pass is active. All unlocked subjects now show full curated answers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">
          Welcome back{userData.name ? `, ${userData.name}` : ''}.
        </h1>
        <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">
          {nextExam && nextExamDaysLeft != null
            ? `${nextExamDaysLeft > 0 ? `${nextExamDaysLeft} days until` : 'Today is'} ${nextExam.courseCode}: ${nextExamCourse?.name ?? 'your next paper'}.`
            : 'June 2026 TEE schedule is ready for your selected papers.'}
        </p>
      </div>

      {nextExam && (
        <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm dark:border-teal-900/50 dark:bg-zinc-900">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Next exam</p>
              <h2 className="mt-2 text-2xl font-bold dark:text-white">
                {nextExam.courseCode} on {formatExamDate(nextExam.date)}
              </h2>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {formatExamWeekday(nextExam.date)}, {nextExam.session} session, {nextExam.startTime}-{nextExam.endTime}
              </p>
            </div>
            <Link
              href={`/courses/${nextExam.courseCode}`}
              className="rounded-full bg-teal-700 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95"
            >
              Study this paper first
            </Link>
          </div>
        </div>
      )}

      {/* Upgrade Banner for free users */}
      {userData.plan_tier === 'free' && (
        <div className="relative overflow-hidden rounded-3xl bg-teal-700 p-8 text-white shadow-xl shadow-teal-700/20">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Your first paper is free</h2>
              <p className="mt-1 opacity-90">
                Study one paper fully. Upgrade when Topper101 has earned your trust, or invite a friend to unlock another paper.
              </p>
            </div>
            <Link 
              href={ROUTES.pricing}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-teal-700 hover:bg-zinc-100 transition-all active:scale-95"
            >
              Unlock more subjects from ₹99
            </Link>
            {userData.referral_code && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Invite a friend → unlock another paper free</p>
                <CopyReferralLink
                  referralCode={userData.referral_code}
                  siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.topper101.com'}
                  signupPath={ROUTES.signup}
                />
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Questions Reviewed', value: String(totalReviewed), icon: '✅' },
          { label: 'Bookmarked', value: String(totalBookmarked), icon: '🔖' },
          { label: 'Papers Unlocked', value: String(papersUnlocked), icon: '🔓' },
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

      {/* Referral Dashboard Widget */}
      {userData.referral_code && (
        <ReferralDashboard
          referralCode={userData.referral_code}
          referrals={referrals ?? []}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://topper101.com'}
        />
      )}

      {/* Paper Cards */}
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Your Papers</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Add Year 1 or Year 2 papers anytime; the dashboard orders your next exam automatically.
            </p>
          </div>
          <Link
            href={ROUTES.settings}
            className="rounded-full border border-zinc-300 px-5 py-2.5 text-center text-sm font-bold text-zinc-700 transition-all hover:border-teal-700 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Add or change papers
          </Link>
        </div>
        {(!courses || courses.length === 0) ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">No courses found for your selected papers.</p>
            <Link href={ROUTES.onboardingPapers} className="mt-4 inline-block rounded-full bg-teal-700 px-6 py-2 text-sm font-bold text-white hover:bg-teal-600">
              Re-select Papers
            </Link>
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => {
            const progress = progressByCourse[course.id] ?? { reviewed: 0, bookmarked: 0 };
            const total = totalsByCourse[course.id] ?? 0;
            const pct = total > 0 ? Math.round((progress.reviewed / total) * 100) : 0;
            const exam = getExamSchedule(course.code);
            const unlocked = canAccessCourse({
              planTier: userData.plan_tier,
              courseCode: course.code,
              entitlements,
            });

            return (
              <div key={course.code} className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-teal-700/50 transition-all dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30">
                    {course.code}
                  </div>
                  <div className="flex items-center gap-2">
                    {userData.plan_tier === 'free' && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        unlockedCourses.has(course.code)
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {unlocked ? 'Unlocked' : 'Preview'}
                      </span>
                    )}
                    <div className="text-xs font-medium text-zinc-400">{pct}% reviewed</div>
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold leading-tight dark:text-white group-hover:text-teal-700 transition-colors">
                  {course.name}
                </h3>
                {exam && (
                  <p className="mt-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Exam: {formatExamDate(exam.date)} · {exam.startTime}-{exam.endTime}
                  </p>
                )}

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
