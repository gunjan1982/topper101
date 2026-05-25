'use client';

import { useEffect, useRef, useState } from 'react';

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
}

export default function CoursePdfPanels({
  courseCode,
  sessionFilters,
  initialYear,
  initialSession,
}: CoursePdfPanelsProps) {
  const defaultSession = sessionFilters.find(
    (s) => s.year === initialYear && s.session === initialSession
  ) ?? sessionFilters[0];

  const [qpYear, setQpYear] = useState<number>(defaultSession?.year ?? 2024);
  const [qpSession, setQpSession] = useState<string>(defaultSession?.session ?? 'December');
  const [textbookPage, setTextbookPage] = useState(1);
  const [qpError, setQpError] = useState(false);
  const [tbError, setTbError] = useState(false);

  const textbookKeyRef = useRef(0); // increment to force iframe remount

  // Listen for textbookJump events dispatched by QuestionCard
  useEffect(() => {
    const handler = (e: Event) => {
      const page = (e as CustomEvent<{ page: number }>).detail?.page;
      if (page && page > 0) {
        setTextbookPage(page);
        textbookKeyRef.current += 1;
      }
    };
    window.addEventListener('textbookJump', handler);
    return () => window.removeEventListener('textbookJump', handler);
  }, []);

  // Reset error state when session changes
  useEffect(() => { setQpError(false); }, [qpYear, qpSession]);
  useEffect(() => { setTbError(false); }, [courseCode]);

  const qpSrc = `/api/pdf/qpaper/${courseCode}?year=${qpYear}&session=${encodeURIComponent(qpSession)}`;
  const textbookSrc = `/api/pdf/textbook/${courseCode}#page=${textbookPage}`;

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

      {/* ── Bottom panel: Textbook ── */}
      <div className="flex flex-col min-h-0 flex-[3] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            📚 IGNOU Textbook
          </span>
          {textbookPage > 1 && (
            <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
              Page {textbookPage}
            </span>
          )}
          {textbookPage === 1 && (
            <span className="text-[10px] text-zinc-400 italic">Click a question to jump</span>
          )}
        </div>

        {tbError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="text-3xl">📚</span>
            <p className="text-sm text-zinc-500">
              Textbook not available locally.
            </p>
            <a
              href={`https://egyankosh.ac.in/handle/123456789/4453`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-teal-700 underline"
            >
              Browse eGyanKosh MAPC →
            </a>
          </div>
        ) : (
          <iframe
            key={textbookPage}
            src={textbookSrc}
            className="flex-1 w-full border-0"
            title={`${courseCode} Textbook — page ${textbookPage}`}
            onError={() => setTbError(true)}
          />
        )}
      </div>
    </div>
  );
}
