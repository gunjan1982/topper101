'use client';

import { useState } from 'react';
import { updateSettings } from './actions';

interface Course {
  id: string;
  code: string;
  name: string;
  year: number;
  stream: string | null;
}

interface SettingsFormProps {
  initialYear: number;
  initialStream: string | null;
  initialPapers: string[];
  allCourses: Course[];
}

const STREAMS = ['Counselling', 'Clinical', 'Organisational'] as const;

export default function SettingsForm({
  initialYear,
  initialStream,
  initialPapers,
  allCourses,
}: SettingsFormProps) {
  const [year, setYear] = useState<number>(initialYear);
  const [stream, setStream] = useState<string | null>(initialStream);
  const [pendingStream, setPendingStream] = useState<string | null>(null);
  const [showStreamConfirm, setShowStreamConfirm] = useState(false);
  const [selectedPapers, setSelectedPapers] = useState<string[]>(initialPapers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute which courses to show based on current year/stream selection
  const visibleCourses = allCourses.filter((c) => {
    if (c.year !== year) return false;
    if (year === 2) return c.stream === stream;
    return true;
  });

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    setStream(null);
    // Reset papers when year changes — different courses apply
    setSelectedPapers([]);
  };

  const handleStreamRequest = (newStream: string) => {
    if (newStream === stream) return;
    // Only show confirm dialog if user already had papers from old stream
    if (stream && selectedPapers.length > 0) {
      setPendingStream(newStream);
      setShowStreamConfirm(true);
    } else {
      setStream(newStream);
      setSelectedPapers([]);
    }
  };

  const confirmStreamChange = () => {
    if (pendingStream) {
      setStream(pendingStream);
      setSelectedPapers([]);
    }
    setShowStreamConfirm(false);
    setPendingStream(null);
  };

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
    setSaving(true);
    try {
      await updateSettings({ year, stream, papers: selectedPapers });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Stream Confirmation Dialog */}
      {showStreamConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
            <h3 className="text-xl font-bold dark:text-white">Change Stream?</h3>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Your progress in <strong>{stream}</strong> papers will be preserved but hidden from your dashboard.
            </p>
            <div className="mt-8 flex gap-4">
              <button
                onClick={confirmStreamChange}
                className="flex-1 rounded-full bg-teal-700 py-3 text-sm font-bold text-white hover:bg-teal-600 transition-all"
              >
                Yes, change stream
              </button>
              <button
                onClick={() => { setShowStreamConfirm(false); setPendingStream(null); }}
                className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Year Selection */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white">Year of Study</h2>
        <div className="flex gap-4">
          {[1, 2].map((y) => (
            <button
              key={y}
              onClick={() => handleYearChange(y)}
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

      {/* Stream Selection (Year 2 only) */}
      {year === 2 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">Stream</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {STREAMS.map((s) => (
              <button
                key={s}
                onClick={() => handleStreamRequest(s)}
                className={`flex-1 rounded-2xl border p-4 text-center text-sm font-bold transition-all ${
                  stream === s
                    ? 'border-teal-700 bg-teal-50 text-teal-700 ring-1 ring-teal-700 dark:bg-teal-900/20'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Paper Selection */}
      {visibleCourses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold dark:text-white">
            Your Papers
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({selectedPapers.length} selected)
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleCourses.map((course) => (
              <button
                key={course.id}
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
                <h3 className="font-bold leading-tight dark:text-white">{course.name}</h3>
              </button>
            ))}
          </div>
        </section>
      )}

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
