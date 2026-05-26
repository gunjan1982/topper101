'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [excerpt, setExcerpt] = useState<{ page: number; text: string } | null>(null);
  const [openDrawer, setOpenDrawer] = useState<DrawerView>(null);

  // Listen for textbookJump events dispatched by QuestionCard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ page: number; excerpt: string | null }>).detail;
      if (detail?.page > 0) {
        setExcerpt({ page: detail.page, text: detail.excerpt ?? '' });
        setOpenDrawer('textbook'); // auto-open textbook drawer on question click
      }
    };
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

  // Trim excerpt to a readable length (~800 chars) without cutting mid-word
  const displayText = excerpt?.text
    ? (excerpt.text.length > 800
        ? excerpt.text.slice(0, 800).replace(/\s\S*$/, '') + ' …'
        : excerpt.text)
    : null;

  return (
    <>
      {/* ── Floating toggle buttons (always visible, right edge) ── */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <button
          onClick={() => setOpenDrawer(openDrawer === 'qpaper' ? null : 'qpaper')}
          aria-label="Toggle Question Paper viewer"
          className={`group flex flex-col items-center gap-1 rounded-l-2xl border border-r-0 px-2 py-3 text-[10px] font-bold uppercase tracking-wider shadow-md transition-all ${
            openDrawer === 'qpaper'
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-zinc-600 border-zinc-200 hover:border-teal-700 hover:text-teal-700 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
          }`}
        >
          <span className="text-base">📄</span>
          <span className="writing-vertical">Q Paper</span>
        </button>
        <button
          onClick={() => setOpenDrawer(openDrawer === 'textbook' ? null : 'textbook')}
          aria-label="Toggle Textbook section viewer"
          className={`group flex flex-col items-center gap-1 rounded-l-2xl border border-r-0 px-2 py-3 text-[10px] font-bold uppercase tracking-wider shadow-md transition-all ${
            openDrawer === 'textbook'
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-zinc-600 border-zinc-200 hover:border-teal-700 hover:text-teal-700 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
          }`}
        >
          <span className="text-base">📚</span>
          <span className="writing-vertical">Textbook</span>
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
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            {displayText ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                    Page {excerpt?.page}
                  </span>
                  <span className="text-[11px] text-zinc-400">{courseCode}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                  {displayText}
                </p>
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <a
                    href="https://egyankosh.ac.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Read full textbook on eGyanKosh →
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="text-4xl opacity-30">📖</span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Click any question card to see the matching IGNOU textbook section here.
                </p>
                {Object.keys(questionPageMap).length > 0 && (
                  <p className="text-xs text-zinc-400">
                    {Object.keys(questionPageMap).length} questions mapped to textbook
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Vertical text utility for the toggle buttons */}
      <style jsx>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
}
