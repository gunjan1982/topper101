'use client';

import { useEffect, useRef, useState } from 'react';
import { resolveTextbookPage } from '@/lib/textbookOffsets';

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

type ActiveTab = 'qpaper' | 'textbook';

interface TextbookState {
  page: number | null;
  excerpt: string | null;
  /** Resolved direct Supabase URL (no redirects, so #page=N fragment is preserved) */
  resolvedUrl: string | null;
  /** Bump this to force iframe reload when page changes */
  iframeKey: number;
}

/**
 * Overlay div that blocks right-click context menu and keyboard download shortcuts
 * on an embedded iframe (PDF viewer).
 */
function PdfProtectionOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-10"
      style={{ pointerEvents: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

export default function CoursePdfPanels({
  courseCode,
  sessionFilters,
  initialYear,
  initialSession,
}: CoursePdfPanelsProps) {
  const defaultSession =
    sessionFilters.find(
      (s) => s.year === initialYear && s.session === initialSession
    ) ?? sessionFilters[0];

  const [qpYear, setQpYear] = useState<number>(defaultSession?.year ?? 2024);
  const [qpSession, setQpSession] = useState<string>(
    defaultSession?.session ?? 'December'
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('qpaper');
  const [tbState, setTbState] = useState<TextbookState>({
    page: null,
    excerpt: null,
    resolvedUrl: null,
    iframeKey: 0,
  });
  const qpIframeRef = useRef<HTMLIFrameElement>(null);
  const tbIframeRef = useRef<HTMLIFrameElement>(null);

  // Resolve the textbook URL once on mount
  useEffect(() => {
    fetch(`/api/pdf/textbook/${courseCode}/url`)
      .then((r) => r.json())
      .then((data: { url?: string }) => {
        if (data.url) {
          setTbState((prev) => ({ ...prev, resolvedUrl: data.url! }));
        }
      })
      .catch(() => {/* silent — will fallback to proxy URL */});
  }, [courseCode]);

  // Listen for textbookJump events dispatched by QuestionCard
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ page: number | null; excerpt: string | null }>;
      const newPage = ev.detail?.page ?? null;
      setTbState((prev) => ({
        ...prev,
        page: newPage,
        excerpt: ev.detail?.excerpt ?? null,
        // Only increment iframeKey when the page actually changes to force iframe reload
        iframeKey: newPage !== prev.page ? prev.iframeKey + 1 : prev.iframeKey,
      }));
      // Auto-switch to textbook tab when a question is clicked
      setActiveTab('textbook');
    };
    window.addEventListener('textbookJump', handler);
    return () => window.removeEventListener('textbookJump', handler);
  }, []);

  // Block Ctrl+S / Cmd+S (save/download) shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const qpSrc = `/api/pdf/qpaper/${courseCode}?year=${qpYear}&session=${encodeURIComponent(qpSession)}#toolbar=0&navpanes=0`;

  /**
   * Build the textbook iframe src. We use the resolved direct URL with the
   * #page=N fragment appended CLIENT-SIDE so browsers don't lose the fragment
   * on an HTTP redirect. Falls back to the proxy API URL (dev mode).
   */
  const buildTbSrc = (page: number | null): string => {
    const base = tbState.resolvedUrl ?? `/api/pdf/textbook/${courseCode}`;
    const params = 'toolbar=0&navpanes=0';
    if (page && page > 0) {
      return `${base}#page=${page}&${params}`;
    }
    return `${base}#${params}`;
  };

  const tbSrc = buildTbSrc(tbState.page);

  return (
    <aside className="hidden lg:flex flex-col w-[34%] shrink-0 sticky top-[73px] h-[calc(100vh-73px)] border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-zinc-50 dark:bg-zinc-900">
        <button
          id="pdf-tab-qpaper"
          onClick={() => setActiveTab('qpaper')}
          aria-label="Question Paper tab"
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${
            activeTab === 'qpaper'
              ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-600 bg-white dark:bg-zinc-950'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <span className="text-base">📄</span>
          <span>Q Paper</span>
        </button>
        <button
          id="pdf-tab-textbook"
          onClick={() => setActiveTab('textbook')}
          aria-label="Textbook tab"
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors ${
            activeTab === 'textbook'
              ? 'text-amber-700 dark:text-amber-400 border-b-2 border-amber-600 bg-white dark:bg-zinc-950'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <span className="text-base">📚</span>
          <span>Textbook</span>
          {tbState.page && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-[9px] font-bold text-amber-700 dark:text-amber-400">
              ✓
            </span>
          )}
        </button>
      </div>

      {/* ── Q Paper panel ── */}
      {activeTab === 'qpaper' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Session selector */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950">
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
            <span className="text-xs text-zinc-400 dark:text-zinc-600 select-none">
              {courseCode} · {qpSession} {qpYear}
            </span>
          </div>
          {/* Protected PDF iframe */}
          <div className="relative flex-1 min-h-0">
            <PdfProtectionOverlay />
            <iframe
              ref={qpIframeRef}
              key={`${qpYear}-${qpSession}`}
              src={qpSrc}
              className="w-full h-full border-0"
              title={`${courseCode} Question Paper ${qpSession} ${qpYear}`}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      )}

      {/* ── Textbook panel ── */}
      {activeTab === 'textbook' && (
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-zinc-950">
          {/* Info bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              {tbState.page && tbState.page > 0 ? (() => {
                const resolved = resolveTextbookPage(courseCode, tbState.page);
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20">
                    📖 {resolved?.displayLabel ?? `Page ${tbState.page}`}
                  </span>
                );
              })() : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  Click a question to jump to its page
                </span>
              )}
            </div>
            {/* Grounded badge */}
            {tbState.page && (
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-600/10 dark:bg-teal-950/30 dark:text-teal-400">
                📍 Textbook Match
              </span>
            )}
          </div>

          {/* PDF iframe or empty state */}
          {tbState.resolvedUrl || process.env.NODE_ENV === 'development' ? (
            <div className="relative flex-1 min-h-0">
              <PdfProtectionOverlay />
              <iframe
                ref={tbIframeRef}
                key={tbState.iframeKey}
                src={tbSrc}
                className="w-full h-full border-0"
                title={`${courseCode} Textbook`}
                onContextMenu={(e) => e.preventDefault()}
              />
              {/* Excerpt tooltip strip at bottom when page is matched */}
              {tbState.excerpt && tbState.page && (() => {
                const resolved = resolveTextbookPage(courseCode, tbState.page);
                return (
                  <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-amber-200 bg-amber-50/95 dark:bg-zinc-900/95 dark:border-amber-900/40 backdrop-blur-sm px-4 py-3 max-h-32 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                      Matched excerpt · {resolved?.displayLabel ?? `Page ${tbState.page}`}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-4 select-none">
                      {tbState.excerpt.substring(0, 300)}…
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Loading / no URL yet */
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 gap-3">
              <span className="text-4xl">📚</span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {tbState.resolvedUrl === null && tbState.page === null
                  ? 'Select a Question'
                  : 'Textbook Loading…'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-[240px]">
                {tbState.resolvedUrl === null && tbState.page === null
                  ? 'Click any question card to jump to its textbook page.'
                  : 'Fetching the textbook PDF. This may take a moment.'}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
