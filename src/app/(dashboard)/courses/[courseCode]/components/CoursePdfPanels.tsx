'use client';

import { useEffect, useState } from 'react';
import type { QuestionTextbookMatch } from '../page';

export interface PdfSessionItem {
  year: number;
  session: string;
  label: string;
}

interface CoursePdfPanelsProps {
  courseCode: string;
  sessionFilters: PdfSessionItem[];
  initialYear?: number | null;
  initialSession?: string | null;
  questionPageMap: Record<string, QuestionTextbookMatch>;
}

type DrawerView = 'qpaper' | 'textbook' | null;

export default function CoursePdfPanels({
  courseCode,
  sessionFilters,
  initialYear,
  initialSession,
  questionPageMap,
}: CoursePdfPanelsProps) {
  const defaultSession = sessionFilters.find(
    (s) => s.year === initialYear && s.session === initialSession
  ) ?? sessionFilters[0];

  const [qpYear, setQpYear] = useState<number>(defaultSession?.year ?? 2024);
  const [qpSession, setQpSession] = useState<string>(defaultSession?.session ?? 'December');
  const [openDrawer, setOpenDrawer] = useState<DrawerView>(null);

  // Auto-open textbook drawer when a question card is clicked
  useEffect(() => {
    const handler = () => setOpenDrawer('textbook');
    window.addEventListener('textbookJump', handler);
    return () => window.removeEventListener('textbookJump', handler);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDrawer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const qpSrc = `/api/pdf/qpaper/${courseCode}?year=${qpYear}&session=${encodeURIComponent(qpSession)}`;

  return (
    <>
      {/* ── Floating toggle buttons (always visible, bottom-right corner) ── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <button
          onClick={() => setOpenDrawer(openDrawer === 'qpaper' ? null : 'qpaper')}
          aria-label="Toggle Question Paper viewer"
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 ${
            openDrawer === 'qpaper'
              ? 'bg-teal-800 text-white ring-2 ring-teal-300'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
        >
          <span className="text-lg">📄</span>
          <span>Q Paper</span>
        </button>
        <button
          onClick={() => setOpenDrawer(openDrawer === 'textbook' ? null : 'textbook')}
          aria-label="Toggle Textbook section viewer"
          className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 ${
            openDrawer === 'textbook'
              ? 'bg-amber-700 text-white ring-2 ring-amber-300'
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          <span className="text-lg">📚</span>
          <span>Textbook</span>
        </button>
      </div>

      {/* ── Backdrop (mobile only) ── */}
      {openDrawer && (
        <button
          onClick={() => setOpenDrawer(null)}
          aria-label="Close drawer"
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── Slide-in Drawer ── */}
      <aside
        className={`fixed top-0 right-0 z-30 h-screen w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-out flex flex-col ${
          openDrawer ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!openDrawer}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{openDrawer === 'qpaper' ? '📄' : '📚'}</span>
            <span className="text-sm font-bold dark:text-white">
              {openDrawer === 'qpaper' ? 'Question Paper' : 'Textbook Section'}
            </span>
          </div>
          <button
            onClick={() => setOpenDrawer(null)}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Q Paper drawer content ── */}
        {openDrawer === 'qpaper' && (
          <>
            <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <select
                value={`${qpYear}|${qpSession}`}
                onChange={(e) => {
                  const [yr, sess] = e.target.value.split('|');
                  setQpYear(parseInt(yr, 10));
                  setQpSession(sess);
                }}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-600/50 cursor-pointer"
              >
                {sessionFilters.map((s) => (
                  <option key={`${s.year}|${s.session}`} value={`${s.year}|${s.session}`}>
                    {s.label}
                  </option>
                ))}
              </select>
              <a
                href={qpSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
              >
                Open in new tab ↗
              </a>
            </div>
            <iframe
              key={`${qpYear}-${qpSession}`}
              src={qpSrc}
              className="flex-1 w-full border-0 min-h-0"
              title={`${courseCode} Question Paper ${qpSession} ${qpYear}`}
            />
          </>
        )}

        {/* ── Textbook drawer content ── */}
        {openDrawer === 'textbook' && (
          <iframe
            src={`/api/pdf/textbook/${courseCode}`}
            className="flex-1 w-full border-0 min-h-0"
            title={`${courseCode} Textbook`}
          />
        )}
      </aside>
    </>
  );
}
