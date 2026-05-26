'use client';

import { useState, useMemo, useTransition } from 'react';
import { generateStudyPlan, saveStudyPlan, type PlanDay } from './actions';
import { COURSE_CATALOG } from '@/lib/courseCatalog';

type TopicCluster = {
  id: string;
  cluster_name: string;
  frequency_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  frequency_count: number;
  course_code: string;
};

interface PlannerFormProps {
  selectedPapers: string[];
  topicClusters: TopicCluster[];
  existingPlan: PlanDay[] | null;
  defaultExamDate: string;
}

const phaseConfig = {
  prep: {
    label: 'Early prep',
    leftBg: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    dot: 'bg-green-500',
  },
  mid: {
    label: 'Mid prep',
    leftBg: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    dot: 'bg-yellow-500',
  },
  final: {
    label: 'Final week',
    leftBg: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    dot: 'bg-orange-500',
  },
  buffer: {
    label: 'Revision',
    leftBg: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    dot: 'bg-red-500',
  },
} as const;

const tierDotColor: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

export default function PlannerForm({
  selectedPapers,
  topicClusters,
  existingPlan,
  defaultExamDate,
}: PlannerFormProps) {
  const [examDate, setExamDate] = useState(defaultExamDate);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [selectedCourses, setSelectedCourses] = useState<string[]>(selectedPapers);
  const [plan, setPlan] = useState<PlanDay[] | null>(existingPlan);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const toggleCourse = (code: string) => {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const clustersByCourse = useMemo(() => {
    const map: Record<string, { high: number; medium: number; low: number; total: number }> = {};
    for (const code of selectedPapers) {
      const clusters = topicClusters.filter((c) => c.course_code === code);
      map[code] = {
        high: clusters.filter((c) => c.frequency_tier === 'HIGH').length,
        medium: clusters.filter((c) => c.frequency_tier === 'MEDIUM').length,
        low: clusters.filter((c) => c.frequency_tier === 'LOW').length,
        total: clusters.length,
      };
    }
    return map;
  }, [selectedPapers, topicClusters]);

  const handleGenerate = () => {
    setError(null);
    setSaveSuccess(false);
    if (selectedCourses.length === 0) {
      setError('Select at least one subject.');
      return;
    }
    if (!examDate) {
      setError('Enter an exam start date.');
      return;
    }
    startGenerating(async () => {
      try {
        const result = await generateStudyPlan({
          coursesCodes: selectedCourses,
          hoursPerDay,
          examDate,
        });
        setPlan(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to generate plan. Please try again.');
      }
    });
  };

  const handleSave = () => {
    if (!plan) return;
    setError(null);
    startSaving(async () => {
      try {
        await saveStudyPlan({
          coursesCodes: selectedCourses,
          hoursPerDay,
          examDate,
          planData: plan,
        });
        setSaveSuccess(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save plan.');
      }
    });
  };

  // Progress stats
  const futureDays = plan ? plan.filter((d) => new Date(d.date) >= today) : [];
  const daysRemaining = futureDays.length;
  const topicsRemaining = futureDays.reduce((s, d) => s + d.topics.length, 0);
  const totalTopics = plan ? plan.reduce((s, d) => s + d.topics.length, 0) : 0;
  const progressPct =
    totalTopics > 0 ? Math.round(((totalTopics - topicsRemaining) / totalTopics) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Input Section ── */}
      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-lg font-bold dark:text-white">Plan Settings</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Exam starts on
            </span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Hours I can study per day
            </span>
            <input
              type="number"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Math.max(0.5, parseFloat(e.target.value) || 2))}
              min={0.5}
              max={12}
              step={0.5}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Subjects to include
          </span>
          {selectedPapers.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              No papers selected.{' '}
              <a href="/settings" className="text-teal-700 hover:underline">
                Add papers in Settings
              </a>
              .
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedPapers.map((code) => {
                const course = COURSE_CATALOG.find((c) => c.code === code);
                const stats = clustersByCourse[code];
                const isChecked = selectedCourses.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCourse(code)}
                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                      isChecked
                        ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <div
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        isChecked
                          ? 'bg-teal-700 text-white'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {code}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-snug text-zinc-700 dark:text-zinc-300">
                      {course?.name ?? code}
                    </p>
                    {stats && stats.total > 0 && (
                      <p className="mt-2 text-xs text-zinc-400">
                        {stats.total} topics &middot;{' '}
                        <span className="text-red-500">{stats.high}H</span>{' '}
                        <span className="text-yellow-600">{stats.medium}M</span>{' '}
                        <span className="text-green-600">{stats.low}L</span>
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-full bg-teal-700 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? 'Generating…' : 'Generate Plan'}
          </button>
        </div>
      </section>

      {/* ── Plan Output ── */}
      {plan !== null && (
        <section className="space-y-6">
          {/* Progress bar + Save button */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {daysRemaining} days remaining &middot; {topicsRemaining} topics left
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {totalTopics - topicsRemaining} of {totalTopics} topics covered so far
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || plan.length === 0}
                className={`rounded-full border px-6 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  saveSuccess
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-teal-700 text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                }`}
              >
                {isSaving ? 'Saving…' : saveSuccess ? '✓ Plan Saved' : 'Save Plan'}
              </button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-4">
              {(Object.entries(phaseConfig) as [keyof typeof phaseConfig, (typeof phaseConfig)[keyof typeof phaseConfig]][]).map(
                ([phase, cfg]) => (
                  <span key={phase} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                ),
              )}
            </div>
          </div>

          {plan.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-zinc-500 dark:text-zinc-400">
                No study days available between today and your exam date. Move the exam date
                further out or reduce the buffer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.map((day) => {
                const cfg = phaseConfig[day.phase];
                const isPast = new Date(day.date) < today;
                return (
                  <div
                    key={day.date}
                    className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white py-4 pl-7 pr-5 dark:border-zinc-800 dark:bg-zinc-900 ${
                      isPast ? 'opacity-40' : ''
                    }`}
                  >
                    {/* Colored left stripe */}
                    <div
                      className={`absolute inset-y-0 left-0 w-1.5 ${cfg.leftBg}`}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold dark:text-white">{day.dayLabel}</p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                      <p className="shrink-0 text-xs font-semibold text-zinc-500 dark:text-zinc-400 sm:text-right">
                        {day.totalMinutes > 0 ? `${day.totalMinutes} min` : '—'}
                      </p>
                    </div>

                    {day.topics.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day.topics.map((topic, i) => (
                          <div
                            key={`${topic.clusterId}-${i}`}
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200/60 bg-zinc-50 px-3 py-1.5 dark:border-zinc-700/50 dark:bg-zinc-800/60"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${tierDotColor[topic.tier] ?? 'bg-zinc-400'}`}
                            />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {topic.clusterName}
                            </span>
                            <span className="text-xs text-zinc-400">{topic.courseCode}</span>
                            <span className="text-xs text-zinc-400">{topic.minutesAllocated}m</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs italic text-zinc-400">
                        No topics scheduled · rest day
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
