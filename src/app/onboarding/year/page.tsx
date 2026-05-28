'use client';

import { useState, useTransition } from 'react';
import { updateYear } from '../actions';

export default function YearSelectionPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (year: number) => {
    setSelectedYear(year);
    startTransition(async () => {
      await updateYear(year);
    });
  };

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Which year are you in?</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Select your current year of study in IGNOU MAPC.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          onClick={() => handleSelect(1)}
          disabled={isPending}
          className={`group w-full h-48 flex flex-col items-center justify-center rounded-3xl border p-6 transition-all relative ${
            isPending && selectedYear === 1
              ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
              : 'border-zinc-200 bg-white hover:border-teal-700 hover:ring-1 hover:ring-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
          } ${isPending ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          {isPending && selectedYear === 1 ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-teal-700 mb-4 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h2 className="text-xl font-bold text-teal-700 dark:text-teal-400">Setting up Year 1...</h2>
            </div>
          ) : (
            <>
              <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">📚</div>
              <h2 className="text-xl font-bold dark:text-white">Year 1</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Core Papers (MPC-001 to 006)</p>
            </>
          )}
        </button>

        <button
          onClick={() => handleSelect(2)}
          disabled={isPending}
          className={`group w-full h-48 flex flex-col items-center justify-center rounded-3xl border p-6 transition-all relative ${
            isPending && selectedYear === 2
              ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
              : 'border-zinc-200 bg-white hover:border-teal-700 hover:ring-1 hover:ring-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
          } ${isPending ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          {isPending && selectedYear === 2 ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-teal-700 mb-4 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h2 className="text-xl font-bold text-teal-700 dark:text-teal-400">Setting up Year 2...</h2>
            </div>
          ) : (
            <>
              <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">🎯</div>
              <h2 className="text-xl font-bold dark:text-white">Year 2</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Specialisation Papers</p>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

