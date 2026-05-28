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

type DrawerView = 'qpaper' | 'textbook' | null;

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
  const [openDrawer, setOpenDrawer] = useState<DrawerView>(null);
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
      setOpenDrawer('textbook');
    };
    window.addEventListener('textbookJump', handler);
    return () => window.removeEventListener('textbookJump', handler);
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Prevent Ctrl+S / Cmd+S (save/download) inside iframe context
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
      if (e.key === 'Escape') setOpenDrawer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const qpSrc = `/api/pdf/qpaper/${courseCode}?year=${qpYear}&session=${encodeURIComponent(qpSession)}`;

  /**
   * Build the textbook iframe src. We use the resolved direct URL with the
   * #page=N fragment appended CLIENT-SIDE so browsers don't lose the fragment
   * on an HTTP redirect. Falls back to the proxy API URL (dev mode).
   */
  const buildTbSrc = (page: number | null): string => {
    const base = tbState.resolvedUrl ?? `/api/pdf/textbook/${courseCode}`;
    return page && page > 0 ? `${base}#page=${page}` : base;
  };

  const tbSrc = buildTbSrc(tbState.page);

  return (
    <>
      {/* ── Floating toggle buttons (always visible, bottom-right corner) ── */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <button
          id="qpaper-drawer-toggle"
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
          id="textbook-drawer-toggle"
          onClick={() => setOpenDrawer(openDrawer === 'textbook' ? null : 'textbook')}
          aria-label="Toggle Textbook viewer"
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
              {openDrawer === 'qpaper' ? 'Question Paper' : 'Textbook'}
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
            {/* Session selector bar */}
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
              {/* No "open in new tab" link — intentionally removed to protect content */}
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
                sandbox="allow-scripts allow-same-origin allow-forms"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </>
        )}

        {/* ── Textbook drawer content ── */}
        {openDrawer === 'textbook' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Info bar */}
            <div className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                {tbState.page && tbState.page > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20">
                    📖 Page {tbState.page}
                  </span>
                ) : (
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
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  onContextMenu={(e) => e.preventDefault()}
                />
                {/* Excerpt tooltip strip at bottom when page is matched */}
                {tbState.excerpt && tbState.page && (
                  <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-amber-200 bg-amber-50/95 dark:bg-zinc-900/95 dark:border-amber-900/40 backdrop-blur-sm px-4 py-3 max-h-32 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                      Matched excerpt · Page {tbState.page}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-4 select-none">
                      {tbState.excerpt.substring(0, 300)}…
                    </p>
                  </div>
                )}
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
    </>
  );
}
