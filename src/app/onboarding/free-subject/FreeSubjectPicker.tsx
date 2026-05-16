'use client';

import { useState } from 'react';
import { grantFreeSubject } from '../actions';

interface PaperOption {
  code: string;
  name: string;
  examDate: string | null;
  daysLeft: number | null;
}

interface FreeSubjectPickerProps {
  papers: PaperOption[];
}

export default function FreeSubjectPicker({ papers }: FreeSubjectPickerProps) {
  const [selected, setSelected] = useState<string>(papers[0]?.code ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    await grantFreeSubject(selected);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="space-y-3 text-left">
        {papers.map((paper) => {
          const isSelected = selected === paper.code;
          return (
            <button
              key={paper.code}
              type="button"
              onClick={() => setSelected(paper.code)}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white hover:border-teal-400 dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-teal-600 bg-teal-600' : 'border-zinc-300 dark:border-zinc-600'
                  }`}>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <div className="font-bold text-zinc-950 dark:text-white">{paper.code}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{paper.name}</div>
                  </div>
                </div>
                {paper.examDate && (
                  <div className="text-right text-xs">
                    <div className="font-semibold text-teal-700 dark:text-teal-400">{paper.examDate}</div>
                    {paper.daysLeft != null && paper.daysLeft >= 0 && (
                      <div className="text-zinc-500">{paper.daysLeft}d left</div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={!selected || isSubmitting}
        className="w-full rounded-full bg-teal-700 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Unlocking...' : `Unlock ${selected} for free →`}
      </button>
    </form>
  );
}
