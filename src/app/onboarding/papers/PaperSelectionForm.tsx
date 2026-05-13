'use client';

import { useState, useRef, useEffect } from 'react';
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
}

export default function PaperSelectionForm({ courses, year, stream }: PaperSelectionFormProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  const togglePaper = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding(selected, {
        year,
        stream,
        startedAt: startedAtRef.current,
      });
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
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

      <div className="flex justify-center pt-8">
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
