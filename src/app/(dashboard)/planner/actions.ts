'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type PlanDay = {
  date: string;
  dayLabel: string;
  phase: 'prep' | 'mid' | 'final' | 'buffer';
  topics: {
    clusterId: string;
    clusterName: string;
    courseCode: string;
    tier: string;
    minutesAllocated: number;
  }[];
  totalMinutes: number;
};

type ClusterInput = {
  id: string;
  cluster_name: string;
  frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  course_code: string;
};

type Task = {
  clusterId: string;
  clusterName: string;
  courseCode: string;
  tier: string;
  minutesAllocated: number;
};

type ClusterRow = {
  id: string;
  cluster_name: string;
  frequency_tier: string;
  frequency_count: number;
  course_id: string;
};

type CourseRow = {
  id: string;
  code: string;
};

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function getPhase(dayIndex: number, totalDays: number): 'prep' | 'mid' | 'final' {
  if (totalDays === 0) return 'prep';
  const pct = dayIndex / totalDays;
  if (pct < 0.4) return 'prep';
  if (pct < 0.7) return 'mid';
  return 'final';
}

function buildPlan(
  clusters: ClusterInput[],
  hoursPerDay: number,
  examDate: string,
): PlanDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ey, em, ed] = examDate.split('-').map(Number);
  const examDateObj = new Date(ey, em - 1, ed);
  examDateObj.setHours(0, 0, 0, 0);

  // 2-day buffer before exam
  const bufferStart = new Date(examDateObj);
  bufferStart.setDate(bufferStart.getDate() - 2);

  const studyDays: Date[] = [];
  const bufferDays: Date[] = [];

  const cur = new Date(today);
  while (cur < bufferStart) {
    studyDays.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  while (cur < examDateObj) {
    bufferDays.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const totalStudyDays = studyDays.length;

  const highClusters = clusters.filter((c) => c.frequency_tier === 'HIGH');
  const medClusters = clusters.filter((c) => c.frequency_tier === 'MEDIUM');
  const lowClusters = clusters.filter((c) => c.frequency_tier === 'LOW');

  // Main task list: HIGH first (front-loaded), then MEDIUM, then LOW
  // HIGH: 45 min per session, MEDIUM: 45 min, LOW: 20 min
  const mainTasks: Task[] = [
    ...highClusters.map((c) => ({
      clusterId: c.id,
      clusterName: c.cluster_name,
      courseCode: c.course_code,
      tier: 'HIGH',
      minutesAllocated: 45,
    })),
    ...medClusters.map((c) => ({
      clusterId: c.id,
      clusterName: c.cluster_name,
      courseCode: c.course_code,
      tier: 'MEDIUM',
      minutesAllocated: 45,
    })),
    ...lowClusters.map((c) => ({
      clusterId: c.id,
      clusterName: c.cluster_name,
      courseCode: c.course_code,
      tier: 'LOW',
      minutesAllocated: 20,
    })),
  ];

  // Revision tasks for buffer days: HIGH clusters only at 22 min each
  const revisionTasks: Task[] = highClusters.map((c) => ({
    clusterId: c.id,
    clusterName: c.cluster_name,
    courseCode: c.course_code,
    tier: 'HIGH',
    minutesAllocated: 22,
  }));

  const minutesPerDay = hoursPerDay * 60;
  const result: PlanDay[] = [];
  let taskIdx = 0;

  for (let i = 0; i < studyDays.length; i++) {
    const day = studyDays[i];
    const phase = getPhase(i, totalStudyDays);
    let minutesLeft = minutesPerDay;
    const topics: Task[] = [];

    while (taskIdx < mainTasks.length && minutesLeft >= 20) {
      const task = mainTasks[taskIdx];
      if (task.minutesAllocated <= minutesLeft) {
        topics.push(task);
        minutesLeft -= task.minutesAllocated;
        taskIdx++;
      } else {
        // Task doesn't fit in remaining time today; carry to next day
        break;
      }
    }

    result.push({
      date: formatISO(day),
      dayLabel: formatDayLabel(day),
      phase,
      topics,
      totalMinutes: topics.reduce((s, t) => s + t.minutesAllocated, 0),
    });
  }

  // Buffer days: revision of HIGH-tier clusters
  let revIdx = 0;
  for (const day of bufferDays) {
    let minutesLeft = minutesPerDay;
    const topics: Task[] = [];

    while (revIdx < revisionTasks.length && minutesLeft >= 20) {
      const task = revisionTasks[revIdx];
      if (task.minutesAllocated <= minutesLeft) {
        topics.push(task);
        minutesLeft -= task.minutesAllocated;
        revIdx++;
      } else {
        break;
      }
    }

    result.push({
      date: formatISO(day),
      dayLabel: formatDayLabel(day),
      phase: 'buffer',
      topics,
      totalMinutes: topics.reduce((s, t) => s + t.minutesAllocated, 0),
    });
  }

  return result;
}

export async function generateStudyPlan(params: {
  coursesCodes: string[];
  hoursPerDay: number;
  examDate: string;
}): Promise<PlanDay[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (params.coursesCodes.length === 0) {
    return buildPlan([], params.hoursPerDay, params.examDate);
  }

  const coursesQuery = await supabase
    .from('courses')
    .select('id, code')
    .in('code', params.coursesCodes);

  const courseRows = (coursesQuery.data ?? []) as CourseRow[];
  const courseIdToCode = new Map(courseRows.map((c) => [c.id, c.code]));
  const courseIds = [...courseIdToCode.keys()];

  if (courseIds.length === 0) {
    return buildPlan([], params.hoursPerDay, params.examDate);
  }

  const clustersQuery = await supabase
    .from('topic_clusters')
    .select('id, cluster_name, frequency_tier, frequency_count, course_id')
    .in('course_id', courseIds)
    .order('frequency_count', { ascending: false });

  if (clustersQuery.error) {
    throw new Error(clustersQuery.error.message);
  }

  const rows = (clustersQuery.data ?? []) as ClusterRow[];

  const clusterInputs: ClusterInput[] = rows.map((c) => ({
    id: c.id,
    cluster_name: c.cluster_name,
    frequency_tier: (['HIGH', 'MEDIUM', 'LOW'].includes(c.frequency_tier)
      ? c.frequency_tier
      : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
    course_code: courseIdToCode.get(c.course_id) ?? '',
  }));

  return buildPlan(clusterInputs, params.hoursPerDay, params.examDate);
}

export async function saveStudyPlan(params: {
  coursesCodes: string[];
  hoursPerDay: number;
  examDate: string;
  planData: PlanDay[];
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('study_plans').insert({
    user_id: user.id,
    courses: params.coursesCodes,
    hours_per_day: params.hoursPerDay,
    exam_date: params.examDate,
    plan_data: params.planData,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/planner');
}
