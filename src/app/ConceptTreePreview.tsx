'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { withRedirectTo } from '@/lib/navigation';
import { formatExamDate, getExamSchedule } from '@/lib/examSchedule';

export type PublicClusterPreview = {
  name: string;
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  exams: number;
};

export type PublicCoursePreview = {
  code: string;
  name: string;
  year: number;
  stream: string | null;
  questionCount: number;
  clusters: PublicClusterPreview[];
};

const filterOptions = ['All', 'Year 1', 'Clinical', 'Counselling', 'Organisational', 'Common'] as const;

function clusterTone(tier: 'HIGH' | 'MEDIUM' | 'LOW') {
  if (tier === 'HIGH') {
    return 'border-red-200 bg-red-50/60 text-red-600 dark:border-red-900/40 dark:bg-red-950/20';
  }

  if (tier === 'MEDIUM') {
    return 'border-amber-200 bg-amber-50/60 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20';
  }

  return 'border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900';
}

export default function ConceptTreePreview({ courses }: { courses: PublicCoursePreview[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>('All');
  const [activeCode, setActiveCode] = useState('MPCE-021');
  const signupHref = withRedirectTo(ROUTES.signup, ROUTES.dashboard);

  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Year 1') return course.year === 1;
      return course.stream === activeFilter;
    });
  }, [activeFilter, courses]);

  const activeCourse =
    visibleCourses.find((course) => course.code === activeCode) ??
    visibleCourses[0] ??
    courses[0];
  const activeExam = getExamSchedule(activeCourse?.code ?? '');

  const selectFilter = (filter: (typeof filterOptions)[number]) => {
    setActiveFilter(filter);
    const nextCourse = courses.find((course) => {
      if (filter === 'All') return course.code === activeCode;
      if (filter === 'Year 1') return course.year === 1;
      return course.stream === filter;
    });
    setActiveCode(nextCourse?.code ?? courses[0]?.code ?? '');
  };

  return (
    <section id="concept-tree" className="scroll-mt-24 border-y border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[330px_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Concept Tree Preview</p>
            <h2 className="mt-4 text-3xl font-bold tracking-normal sm:text-5xl">
              See the heat map before you sign up.
            </h2>
            <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Pick a paper to see its complete public topic-cluster map. Questions and AI answers unlock after signup.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => selectFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    activeFilter === filter
                      ? 'bg-teal-700 text-white shadow-lg shadow-teal-700/20'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:border-teal-700 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-6 grid max-h-[430px] gap-2 overflow-y-auto pr-1">
              {visibleCourses.map((course) => (
                <button
                  key={course.code}
                  type="button"
                  onClick={() => setActiveCode(course.code)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    activeCourse.code === course.code
                      ? 'border-teal-700 bg-white shadow-sm ring-1 ring-teal-700 dark:bg-zinc-900'
                      : 'border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {course.code}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      {course.clusters.length} clusters
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold leading-snug">{course.name}</div>
                  {getExamSchedule(course.code) && (
                    <div className="mt-2 text-xs font-semibold text-zinc-500">
                      Exam: {formatExamDate(getExamSchedule(course.code)!.date)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-teal-50 px-2.5 py-1 text-sm font-black text-teal-700 dark:bg-teal-950/40">
                    {activeCourse.code}
                  </span>
                  <span className="text-sm font-medium text-zinc-500">
                    Year {activeCourse.year}{activeCourse.stream ? ` · ${activeCourse.stream}` : ''}
                  </span>
                  {activeExam && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      Exam {formatExamDate(activeExam.date)}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-normal">{activeCourse.name}</h3>
              </div>
              <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {activeCourse.questionCount} Questions Available
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-bold">Frequency Heat Map</h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Showing all {activeCourse.clusters.length} public topic clusters for this paper.
                </p>
              </div>
              <span className="w-fit rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                Public Preview
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeCourse.clusters.map((cluster) => (
                <div
                  key={`${activeCourse.code}-${cluster.name}`}
                  className={`min-h-[116px] rounded-lg border p-4 ${clusterTone(cluster.tier)}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest">{cluster.tier} Tier</span>
                      {cluster.tier === 'HIGH' && <span className="text-sm">🔥</span>}
                    </div>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {cluster.exams} exams
                    </span>
                  </div>
                  <p className="mt-4 text-base font-bold leading-snug text-zinc-950 dark:text-zinc-50">
                    {cluster.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">Sign up to see the important questions for June 2026 TEE for each topic.</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Topic clusters stay public; question-level priority, filters, AI answers, and progress tracking unlock inside your account.
                </p>
              </div>
              <Link
                href={signupHref}
                className="rounded-full bg-teal-700 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95"
              >
                Unlock questions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
