import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PaperSelectionForm from './PaperSelectionForm';
import { COURSE_CATALOG, selectableCourses, type CourseCatalogItem } from '@/lib/courseCatalog';
import { ROUTES } from '@/lib/routes';

export default async function PapersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // Get user's year and stream
  const { data: userData } = await supabase
    .from('users')
    .select('year, stream, selected_papers, phone')
    .eq('id', user.id)
    .single();

  if (!userData || !userData.year) {
    redirect(ROUTES.onboardingYear);
  }

  if (userData.year === 2 && !userData.stream) {
    redirect(ROUTES.onboardingStream);
  }

  const { data: dbCourses, error } = await supabase
    .from('courses')
    .select('id, code, name, year, stream, course_type')
    .order('code');

  if (error) {
    console.error('Error fetching courses:', error);
  }

  const courses = selectableCourses(
    ((dbCourses as CourseCatalogItem[] | null) ?? COURSE_CATALOG),
    userData.year,
    userData.stream ?? null
  );
  const selectedPapers = (userData.selected_papers as string[] | null) ?? [];
  const selectionLabel =
    userData.year === 1
      ? 'Year 1 core papers'
      : `Year 2 · ${userData.stream} stream`;

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Select your papers</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Which papers are you appearing for in the upcoming June TEE?
        </p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <span>
            Showing <strong className="text-zinc-950 dark:text-white">{selectionLabel}</strong>
          </span>
          <Link href={ROUTES.onboardingYear} className="font-bold text-teal-700 hover:text-teal-600">
            Change year
          </Link>
          {userData.year === 2 && (
            <Link href={ROUTES.onboardingStream} className="font-bold text-teal-700 hover:text-teal-600">
              Change stream
            </Link>
          )}
        </div>
      </div>

      <PaperSelectionForm
        courses={courses}
        year={userData.year}
        stream={userData.stream ?? null}
        initialSelected={selectedPapers}
        hasWhatsApp={Boolean(userData.phone?.trim())}
      />
    </div>
  );
}
