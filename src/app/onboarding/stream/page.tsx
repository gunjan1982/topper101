'use client';

import { useState, useTransition } from 'react';
import { updateStream } from '../actions';
import { MAPC_STREAMS } from '@/lib/courseCatalog';

export default function StreamSelectionPage() {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (streamId: string) => {
    setSelectedStream(streamId);
    startTransition(async () => {
      await updateStream(streamId);
    });
  };

  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Choose your specialisation</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Choose your Year 2 stream to see the right papers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MAPC_STREAMS.map((stream) => {
          const isLoading = isPending && selectedStream === stream.id;
          return (
            <button
              key={stream.id}
              onClick={() => handleSelect(stream.id)}
              disabled={isPending}
              className={`group w-full h-40 flex flex-col items-center justify-center rounded-2xl border p-4 transition-all relative ${
                isLoading
                  ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white hover:border-teal-700 hover:ring-1 hover:ring-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
              } ${isPending ? 'opacity-85 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <svg className="animate-spin h-6 w-6 text-teal-700 mb-2 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <h2 className="text-xs font-bold text-teal-700 dark:text-teal-400">Loading...</h2>
                </div>
              ) : (
                <>
                  <div className="mb-3 text-3xl group-hover:scale-110 transition-transform">{stream.icon}</div>
                  <h2 className="text-sm font-bold dark:text-white">{stream.name}</h2>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

