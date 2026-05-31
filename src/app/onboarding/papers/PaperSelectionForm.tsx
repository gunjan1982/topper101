'use client';

import { useState } from 'react';
import { completeOnboarding } from '../actions';

interface Course {
  id: string;
  code: string;
  name: string;
}

interface PaperSelectionFormProps {
  courses: Course[];
  year: number;
  stream: string | null;
  initialSelected?: string[];
  hasWhatsApp?: boolean;
}

export default function PaperSelectionForm({
  courses,
  year,
  stream,
  initialSelected = [],
  hasWhatsApp = false,
}: PaperSelectionFormProps) {
  const visibleCodes = new Set(courses.map((course) => course.code));
  const [selected, setSelected] = useState<string[]>(
    initialSelected.filter((code) => visibleCodes.has(code))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [phone, setPhone] = useState('');

  const togglePaper = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(selected, {
        year,
        stream,
        startedAt,
        phone: !hasWhatsApp && phone.trim() ? phone.trim() : undefined,
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to finalize paper selection. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          We could not load papers for this selection. Go back and choose your year again, or try refreshing the page.
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <button
            key={course.id}
            onClick={() => togglePaper(course.code)}
            className={`flex flex-col items-start rounded-2xl border p-6 text-left transition-all ${
              selected.includes(course.code)
                ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            <div className={`mb-2 rounded-md px-2 py-0.5 text-xs font-bold ${
              selected.includes(course.code) 
                ? 'bg-teal-700 text-white' 
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {course.code}
            </div>
            <h3 className="font-bold dark:text-white leading-tight">{course.name}</h3>
          </button>
        ))}
      </div>
      )}

      {!hasWhatsApp && (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <h4 className="text-sm font-bold dark:text-white">Add your WhatsApp number</h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
            Get instant exam date reminders, study tips, and MAPC community updates directly on WhatsApp.
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number (optional)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
      )}

      <div className="flex flex-col items-center justify-center pt-8 gap-4">
        {error && (
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-center animate-fade-in">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">
              ⚠️ Error: {error}
            </p>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || isSubmitting}
          className="rounded-full bg-teal-700 px-12 py-4 text-lg font-bold text-white shadow-xl shadow-teal-700/20 hover:bg-teal-600 disabled:bg-zinc-300 disabled:shadow-none transition-all active:scale-95 flex items-center gap-2"
        >
          {isSubmitting ? (
            'Preparing your dashboard...'
          ) : (
            <>
              Show Me What to Study
              <span className="text-xl">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
