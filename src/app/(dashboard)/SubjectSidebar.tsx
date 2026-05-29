import { createClient } from '@/lib/supabase/server';
import { courseByCode, type CourseCatalogItem } from '@/lib/courseCatalog';
import { daysUntilExam, getExamSchedule } from '@/lib/examSchedule';
import { canAccessCourse, fetchSubjectEntitlements } from '@/lib/entitlements';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

interface SubjectSidebarProps {
  activeCourseCode?: string;
}

export default async function SubjectSidebar({ activeCourseCode }: SubjectSidebarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('selected_papers, plan_tier')
    .eq('id', user.id)
    .single();

  const selectedPapers: string[] = (userData?.selected_papers as string[]) ?? [];
  const entitlements = await fetchSubjectEntitlements(supabase, user.id);

  const { data: dbCourses } = await supabase
    .from('courses')
    .select('id, code, name, year, stream, course_type')
    .in('code', selectedPapers);

  const courses = selectedPapers
    .map((code) => courseByCode((dbCourses as CourseCatalogItem[] | null) ?? [], code))
    .filter((c): c is CourseCatalogItem => Boolean(c));

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-h-screen sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
      {/* Sidebar header */}
      <div className="px-4 pt-6 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
          Navigation
        </p>
        <nav className="flex flex-col gap-1">
          <Link
            href={ROUTES.dashboard}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <span className="text-base">🏠</span>
            Dashboard
          </Link>
          <Link
            href="/concepts"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <span className="text-base">🧠</span>
            Concept Map
          </Link>
          <Link
            href="/planner"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <span className="text-base">📅</span>
            Planner
          </Link>
        </nav>
      </div>

      <div className="mx-4 my-2 border-t border-zinc-100 dark:border-zinc-800" />

      {/* Subject list */}
      <div className="px-4 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
          My Subjects
        </p>
        <nav className="flex flex-col gap-1">
          {courses.map((course) => {
            if (!course) return null;
            const exam = getExamSchedule(course.code);
            const daysLeft = exam ? daysUntilExam(exam.date) : null;
            const isActive = course.code === activeCourseCode;
            const unlocked = canAccessCourse({
              planTier: userData?.plan_tier,
              courseCode: course.code,
              entitlements,
            });

            return (
              <Link
                key={course.code}
                href={`/courses/${course.code}`}
                className={`group flex flex-col rounded-xl px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-600/30'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold tracking-wide ${
                      isActive
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {course.code}
                  </span>
                  {!unlocked && (
                    <span className="text-[10px] text-zinc-400">🔒</span>
                  )}
                </div>
                <span
                  className={`text-[11px] leading-tight mt-0.5 line-clamp-2 ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-500'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {course.name}
                </span>
                {daysLeft != null && daysLeft >= 0 && (
                  <span
                    className={`mt-1.5 text-[10px] font-semibold ${
                      daysLeft <= 7
                        ? 'text-red-500'
                        : daysLeft <= 21
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {daysLeft === 0 ? '📅 Today!' : `📅 ${daysLeft}d`}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {courses.length === 0 && (
          <p className="text-xs text-zinc-400 italic mt-2">
            No subjects selected.{' '}
            <Link href={ROUTES.settings} className="text-teal-700 underline">
              Add subjects
            </Link>
          </p>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-auto px-4 pb-6">
        <div className="mx-4 mb-4 border-t border-zinc-100 dark:border-zinc-800" />
        <Link
          href={ROUTES.settings}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          <span>⚙️</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}
