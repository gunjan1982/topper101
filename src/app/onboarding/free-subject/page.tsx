import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { COURSE_CATALOG, courseByCode } from '@/lib/courseCatalog';
import { ROUTES } from '@/lib/routes';
import { sortedExamSchedule, formatExamDate, formatExamWeekday, daysUntilExam } from '@/lib/examSchedule';
import FreeSubjectPicker from './FreeSubjectPicker';

export default async function FreeSubjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { data: userData } = await supabase
    .from('users')
    .select('selected_papers, onboarding_complete')
    .eq('id', user.id)
    .single();

  if (!userData?.onboarding_complete) {
    redirect(ROUTES.onboardingYear);
  }

  const selectedPapers = (userData.selected_papers as string[] | null) ?? [];
  if (selectedPapers.length === 0) {
    redirect(ROUTES.onboardingPapers);
  }

  // If user already has a signup_free entitlement, skip the picker
  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('course_code')
    .eq('user_id', user.id)
    .eq('entitlement_type', 'subject_unlock')
    .eq('source', 'signup_free')
    .maybeSingle();

  if (existing) {
    redirect(ROUTES.dashboard);
  }

  // Fetch course names from DB (fallback to catalog)
  const { data: dbCourses } = await supabase
    .from('courses')
    .select('id, code, name, year, stream, course_type')
    .in('code', selectedPapers);

  const courses = dbCourses ?? COURSE_CATALOG;

  // Sort papers by exam date so the soonest exam is first
  const schedule = sortedExamSchedule(selectedPapers);

  // Build the options list in exam-date order, with any papers missing from
  // the schedule appended at the end
  const scheduledCodes = schedule.map((item) => item.courseCode);
  const unscheduledCodes = selectedPapers.filter((code) => !scheduledCodes.includes(code));
  const orderedPapers = [...scheduledCodes, ...unscheduledCodes];

  const paperOptions = orderedPapers.map((code) => {
    const course = courseByCode(courses as Parameters<typeof courseByCode>[0], code);
    const examItem = schedule.find((item) => item.courseCode === code);
    const daysLeft = examItem ? daysUntilExam(examItem.date) : null;
    return {
      code,
      name: course?.name ?? code,
      examDate: examItem ? `${formatExamWeekday(examItem.date)}, ${formatExamDate(examItem.date)}` : null,
      daysLeft,
    };
  });

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Pick your free subject</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Choose one paper to unlock fully — all questions and Textbook word count specific curated answers powered by AI, free forever.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          You can unlock more papers by referring a friend once they make a purchase.
        </p>
      </div>

      <FreeSubjectPicker papers={paperOptions} />
    </div>
  );
}
