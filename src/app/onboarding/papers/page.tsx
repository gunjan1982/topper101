import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PaperSelectionForm from './PaperSelectionForm';

export default async function PapersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's year and stream
  const { data: userData } = await supabase
    .from('users')
    .select('year, stream')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/onboarding/year');
  }

  // Fetch relevant courses
  let query = supabase
    .from('courses')
    .select('id, code, name')
    .eq('year', userData.year);

  if (userData.year === 2 && userData.stream) {
    // For year 2, we show base year 2 courses (if any) + stream specific courses
    // Actually, in the seed script, year 2 courses all have a stream.
    // Let's just filter by stream for year 2.
    query = query.eq('stream', userData.stream);
  }

  const { data: courses, error } = await query;

  if (error) {
    console.error('Error fetching courses:', error);
  }

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Select your papers</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Which papers are you appearing for in the upcoming June TEE?
        </p>
      </div>

      <PaperSelectionForm courses={courses || []} year={userData.year ?? 1} stream={userData.stream ?? null} />
    </div>
  );
}
