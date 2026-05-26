import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { sortedExamSchedule } from '@/lib/examSchedule';
import PlannerForm from './PlannerForm';
import type { PlanDay } from './actions';

export const metadata = {
  title: 'Study Planner — Topper101',
};

type TopicClusterRow = {
  id: string;
  cluster_name: string;
  frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  frequency_count: number;
  course_id: string;
};

type CourseRow = {
  id: string;
  code: string;
};

type StudyPlanRow = {
  id: string;
  plan_data: unknown;
  created_at: string;
};

export default async function PlannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const { data: userData } = await supabase
    .from('users')
    .select('selected_papers, year')
    .eq('id', user.id)
    .single();

  if (!userData) {
    redirect(ROUTES.dashboard);
  }

  const selectedPapers: string[] = (userData.selected_papers as string[]) ?? [];

  // Fetch course IDs for the selected papers
  const coursesQuery = await supabase
    .from('courses')
    .select('id, code')
    .in('code', selectedPapers);

  const courseRows = (coursesQuery.data ?? []) as CourseRow[];
  const courseIdToCode = new Map(courseRows.map((c) => [c.id, c.code]));
  const courseIds = courseRows.map((c) => c.id);

  // Fetch topic clusters ordered by frequency
  type TopicClusterForForm = {
    id: string;
    cluster_name: string;
    frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW';
    frequency_count: number;
    course_code: string;
  };

  let topicClusters: TopicClusterForForm[] = [];

  if (courseIds.length > 0) {
    const clustersQuery = await supabase
      .from('topic_clusters')
      .select('id, cluster_name, frequency_tier, frequency_count, course_id')
      .in('course_id', courseIds)
      .order('frequency_count', { ascending: false });

    const rows = (clustersQuery.data ?? []) as TopicClusterRow[];
    topicClusters = rows.map((c) => ({
      id: c.id,
      cluster_name: c.cluster_name,
      frequency_tier: c.frequency_tier,
      frequency_count: c.frequency_count,
      course_code: courseIdToCode.get(c.course_id) ?? '',
    }));
  }

  // Fetch most recent study plan
  const planQuery = await supabase
    .from('study_plans')
    .select('id, plan_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planRow = planQuery.data as StudyPlanRow | null;
  const existingPlan: PlanDay[] | null = planRow
    ? (planRow.plan_data as PlanDay[])
    : null;

  // Default exam date: earliest exam among selected papers
  const sorted = sortedExamSchedule(selectedPapers);
  const defaultExamDate = sorted[0]?.date ?? '';

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Study Planner</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Generate a personalised day-by-day schedule based on your exam date and available hours.
          High-frequency topics are front-loaded so you cover what matters most first.
        </p>
      </div>

      <PlannerForm
        selectedPapers={selectedPapers}
        topicClusters={topicClusters}
        existingPlan={existingPlan}
        defaultExamDate={defaultExamDate}
      />
    </div>
  );
}
