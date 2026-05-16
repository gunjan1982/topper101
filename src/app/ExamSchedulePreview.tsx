'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { withRedirectTo } from '@/lib/navigation';
import {
  formatExamDate,
  formatExamWeekday,
  JUNE_2026_TEE_DATE_SHEET_URL,
  JUNE_2026_TEE_SOURCE_LABEL,
  scheduleWithCourseDetails,
} from '@/lib/examSchedule';

const tracks = [
  {
    id: 'year-1',
    label: 'Year 1',
    title: 'Your first Year 1 paper is MPC-001 on 09 Jul.',
    codes: ['MPC-001', 'MPC-002', 'MPC-003', 'MPC-004', 'MPC-005', 'MPC-006'],
  },
  {
    id: 'clinical',
    label: 'Clinical',
    title: 'Clinical starts with MPCE-011 on 15 Jun.',
    codes: ['MPCE-011', 'MPCE-012', 'MPCE-013', 'MPCE-046'],
  },
  {
    id: 'counselling',
    label: 'Counselling',
    title: 'Counselling starts with MPCE-021 on 15 Jun.',
    codes: ['MPCE-021', 'MPCE-022', 'MPCE-023', 'MPCE-046'],
  },
  {
    id: 'organisational',
    label: 'Organisational',
    title: 'Organisational starts with MPCE-031 on 15 Jun.',
    codes: ['MPCE-031', 'MPCE-032', 'MPCE-033', 'MPCE-046'],
  },
] as const;

export default function ExamSchedulePreview() {
  const [activeTrackId, setActiveTrackId] = useState<(typeof tracks)[number]['id']>('counselling');
  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? tracks[0];
  const schedule = useMemo(() => scheduleWithCourseDetails(activeTrack.codes), [activeTrack.codes]);
  const firstExam = schedule[0];

  return (
    <section id="exam-schedule" className="scroll-mt-24 border-y border-zinc-200 bg-white px-5 py-16 dark:border-zinc-800 dark:bg-black sm:px-6 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">June 2026 TEE schedule</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-normal sm:text-5xl">
            <span className="block">First know the clock.</span>
            <span className="block">Then choose what to study.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Most MAPC students begin late and feel buried by PDFs. Topper101 uses the official exam dates and repeat-question patterns to help you plan paper by paper.
          </p>
          <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-900/50 dark:bg-teal-950/20">
            <p className="text-sm font-bold text-teal-950 dark:text-teal-50">
              {activeTrack.title}
            </p>
            <p className="mt-1 text-sm text-teal-800 dark:text-teal-200">
              {firstExam ? `${firstExam.courseCode} is in the ${firstExam.session.toLowerCase()} session, ${firstExam.startTime}-${firstExam.endTime}.` : 'Select a track to see its paper order.'}
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#concept-tree"
              className="rounded-full bg-teal-700 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95"
            >
              See high-yield topics
            </a>
            <Link
              href={withRedirectTo(ROUTES.signup, ROUTES.dashboard)}
              className="rounded-full border border-zinc-300 px-6 py-3 text-center text-sm font-bold text-zinc-800 transition-all hover:border-teal-700 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-100"
            >
              Build my study map
            </Link>
          </div>
          <a
            href={JUNE_2026_TEE_DATE_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex text-xs font-semibold text-zinc-500 underline-offset-4 hover:text-teal-700 hover:underline"
          >
            Source: {JUNE_2026_TEE_SOURCE_LABEL}
          </a>
        </div>

        <div className="min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrackId(track.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  activeTrackId === track.id
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'border border-zinc-200 bg-white text-zinc-600 hover:border-teal-700 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                {track.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {schedule.map((item, index) => (
              <div
                key={item.courseCode}
                className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-[120px_1fr_auto] sm:items-center"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">{formatExamWeekday(item.date)}</div>
                  <div className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-50">{formatExamDate(item.date)}</div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-black text-teal-700 dark:bg-teal-950/40">
                      {item.courseCode}
                    </span>
                    {index === 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        First exam
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold leading-snug text-zinc-950 dark:text-zinc-50">
                    {item.course?.name ?? item.courseCode}
                  </p>
                </div>
                <div className="text-sm font-semibold text-zinc-500 sm:text-right">
                  {item.startTime}-{item.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
