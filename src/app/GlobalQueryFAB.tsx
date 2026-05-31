'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import QueryBox from './(dashboard)/QueryBox';

export default function GlobalQueryFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] sm:bottom-6 sm:right-6">
      {/* Popover Card */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-black/90 animate-fade-in ring-1 ring-black/5">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Send a Message
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
              aria-label="Close panel"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <QueryBox isLoggedIn={isLoggedIn} />
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 text-white shadow-2xl ring-2 ring-white/80 hover:scale-105 hover:bg-teal-700 hover:shadow-teal-700/20 active:scale-95 transition-all duration-200 dark:bg-white dark:text-zinc-950 dark:ring-zinc-900/80 sm:h-14 sm:px-5"
        title="Got a query/request?"
        aria-label="Support Query"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-bold sm:text-sm">Help / Query</span>
          </>
        )}
      </button>
    </div>
  );
}
