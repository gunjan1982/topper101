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
  const [qpError, setQpError] = useState(false);
  const prevQpKey = useRef('');

  // Reset Q-paper error when session changes
  useEffect(() => {
    const key = `${qpYear}|${qpSession}`;
    if (key !== prevQpKey.current) { setQpError(false); prevQpKey.current = key; }
  }, [qpYear, qpSession]);

  // Listen for textbookJump events dispatched by QuestionCard
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ page: number; excerpt: string | null }>).detail;
      if (detail?.page > 0) {
        setExcerpt({ page: detail.page, text: detail.excerpt ?? '' });
      }
    };
    window.addEventListener('textbookJump', handler);
    return () => window.removeEventListener('textbookJump', handler);
  }, []);

  const qpSrc = `/api/pdf/qpaper/${courseCode}?year=${qpYear}&session=${encodeURIComponent(qpSession)}`;

  // Trim excerpt to a readable length (~600 chars) without cutting mid-word
  const displayText = excerpt?.text
    ? (excerpt.text.length > 600
        ? excerpt.text.slice(0, 600).replace(/\s\S*$/, '') + ' …'
        : excerpt.text)
    : null;

  return (
    <div className="hidden lg:flex sticky top-[73px] flex-col gap-3 h-[calc(100vh-100px)]">

      {/* ── Top panel: Question Paper ── */}
      <div className="flex flex-col min-h-0 flex-[2] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              📄 Question Paper
            </span>
          </div>
          <select
            value={`${qpYear}|${qpSession}`}
            onChange={(e) => {
              const [yr, sess] = e.target.value.split('|');
              setQpYear(parseInt(yr, 10));
              setQpSession(sess);
            }}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-600/50 cursor-pointer"
          >
            {sessionFilters.map((s) => (
              <option key={`${s.year}|${s.session}`} value={`${s.year}|${s.session}`}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {qpError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-3xl">📄</span>
            <p className="text-sm text-zinc-500">
              Question paper not available locally.
            </p>
            <a
              href={`https://egyankosh.ac.in/handle/123456789/4448`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-teal-700 underline"
            >
              Browse IGNOU eGyanKosh →
            </a>
          </div>
        ) : (
          <iframe
            key={`${qpYear}-${qpSession}`}
            src={qpSrc}
            className="flex-1 w-full border-0"
            title={`${courseCode} Question Paper ${qpSession} ${qpYear}`}
            onError={() => setQpError(true)}
          />
        )}
      </div>

      {/* ── Bottom panel: Textbook Excerpt ── */}
      <div className="flex flex-col min-h-0 flex-[3] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            📚 Textbook Section
          </span>
          {excerpt ? (
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
              Page {excerpt.page}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 italic">Click a question to jump</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          {displayText ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                {displayText}
              </p>
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  {courseCode} textbook · Page {excerpt?.page}
                </span>
                <a
                  href="https://egyankosh.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  Full textbook on eGyanKosh →
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="text-3xl opacity-30">📖</span>
              <p className="text-sm text-zinc-400">
                Click any question to see the relevant<br />section from the IGNOU textbook.
              </p>
              {Object.keys(questionPageMap).length > 0 && (
                <p className="text-xs text-zinc-400">
                  {Object.keys(questionPageMap).length} questions mapped to textbook
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
