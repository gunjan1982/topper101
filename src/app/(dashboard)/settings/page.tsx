import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user settings
  const { data: userData } = await supabase
    .from('users')
    .select('year, stream, selected_papers')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect('/dashboard');
  }

  // Fetch all courses to populate paper picker
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, code, name, year, stream')
    .order('year')
    .order('code');

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Account Settings</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Update your year, stream, and paper selection. Changes take effect immediately.
        </p>
      </div>

      <SettingsForm
        initialYear={userData.year ?? 1}
        initialStream={userData.stream ?? null}
        initialPapers={(userData.selected_papers as string[]) ?? []}
        allCourses={allCourses ?? []}
      />
    </div>
  );
}
