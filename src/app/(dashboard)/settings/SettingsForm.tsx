'use client';

import { useState } from 'react';
import { updateSettings, setUrnaOptIn } from './actions';
import { MAPC_STREAMS, isTheoryCourse, normalizeStream } from '@/lib/courseCatalog';
import { formatExamDate, getExamSchedule } from '@/lib/examSchedule';

interface Course {
  id: string;
  code: string;
  name: string;
  year: number;
  stream: string | null;
  course_type: 'theory' | 'practical' | 'internship' | 'project';
}

interface SettingsFormProps {
  initialYear: number;
  initialStream: string | null;
  initialPhone: string;
  initialPapers: string[];
  initialUrnaOptIn: boolean;
  allCourses: Course[];
}

const paperFilters = ['All', 'Year 1', 'Clinical', 'Counselling', 'Organisational', 'Common'] as const;

export default function SettingsForm({
  initialYear,
  initialStream,
  initialPhone,
  initialPapers,
  initialUrnaOptIn,
  allCourses,
}: SettingsFormProps) {
  const [year, setYear] = useState<number>(initialYear);
  const [stream, setStream] = useState<string | null>(initialStream);
  const [phone, setPhone] = useState(initialPhone);
  const [paperFilter, setPaperFilter] = useState<(typeof paperFilters)[number]>('All');
  const [selectedPapers, setSelectedPapers] = useState<string[]>(initialPapers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urnaOptIn, setUrnaOptInState] = useState(initialUrnaOptIn);
  const [urnaLoading, setUrnaLoading] = useState(false);

  const theoryCourses = allCourses
    .filter((course) => isTheoryCourse(course))
    .sort((a, b) => a.code.localeCompare(b.code));

  const visibleCourses = theoryCourses.filter((course) => {
    if (paperFilter === 'All') return true;
    if (paperFilter === 'Year 1') return course.year === 1;
    return normalizeStream(course.stream) === normalizeStream(paperFilter);
  });

  const togglePaper = (code: string) => {
    setSelectedPapers((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setError(null);
    if (year === 2 && !stream) {
      setError('Please select a stream before saving.');
      return;
    }
    if (selectedPapers.length === 0) {
      setError('Select at least one paper for your dashboard.');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ year, stream, phone, papers: selectedPapers });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Year Selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white">Profile</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This helps us default your stream, but it no longer restricts which exam papers you can add.
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Phone number</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Optional, useful for payment/support issues"
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <div className="flex gap-4">
          {[1, 2].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`flex-1 rounded-2xl border p-5 text-center font-bold transition-all ${
                year === y
                  ? 'border-teal-700 bg-teal-50 text-teal-700 ring-1 ring-teal-700 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
              }`}
            >
              Year {y}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white">Year 2 Stream</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {MAPC_STREAMS.map((mapcStream) => {
            const s = mapcStream.id;
            return (
            <button
              key={s}
              onClick={() => setStream(s)}
              className={`flex-1 rounded-2xl border p-4 text-center text-sm font-bold transition-all ${
                stream === s
                  ? 'border-teal-700 bg-teal-50 text-teal-700 ring-1 ring-teal-700 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
              }`}
            >
              {s}
            </button>
            );
          })}
        </div>
      </section>

      {/* Paper Selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white">
            Your Papers
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({selectedPapers.length} selected)
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select everything you are writing this TEE. Year 1 and Year 2 can live together on the dashboard.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {paperFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setPaperFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                paperFilter === filter
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-teal-700 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {visibleCourses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <button
                key={course.code}
                onClick={() => togglePaper(course.code)}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                  selectedPapers.includes(course.code)
                    ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800'
                }`}
              >
                <div className={`mb-2 rounded-md px-2 py-0.5 text-xs font-bold ${
                  selectedPapers.includes(course.code)
                    ? 'bg-teal-700 text-white'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {course.code}
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Year {course.year}{course.stream ? ` · ${course.stream}` : ''}
                </div>
                <h3 className="font-bold leading-tight dark:text-white">{course.name}</h3>
                {getExamSchedule(course.code) && (
                  <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Exam: {formatExamDate(getExamSchedule(course.code)!.date)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* URNA Opt-in */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex items-start gap-4">
          <button
            role="switch"
            aria-checked={urnaOptIn}
            disabled={urnaLoading}
            onClick={async () => {
              setUrnaLoading(true);
              const newVal = !urnaOptIn;
              setUrnaOptInState(newVal);
              try {
                await setUrnaOptIn(newVal);
              } catch {
                setUrnaOptInState(!newVal);
              } finally {
                setUrnaLoading(false);
              }
            }}
            className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${urnaOptIn ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${urnaOptIn ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Get early access to URNA career platform
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              We&apos;re building a platform to help MAPC graduates find clinical / counselling roles.
              Toggle on to join the waitlist.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-teal-700 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
