'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { getConceptsForCluster, type ConceptNode } from '../../actions';

interface ConceptDrawerProps {
  topicClusterId: string;
  isPaid: boolean;
  userEmail: string | null;
}

const TIER_COLORS: Record<string, string> = {
  HIGH: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300',
  LOW: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
};

function getLayerColor(layer: number): string {
  const colors = [
    'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-300', // Layer 1
    'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-900/30 dark:text-violet-300', // Layer 2
    'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/30 dark:text-fuchsia-300', // Layer 3
    'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300', // Layer 4
    'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300', // Layer 5
    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300', // Layer 6
    'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-300', // Layer 7
  ];
  return colors[(layer - 1) % colors.length];
}

export default function ConceptDrawer({ topicClusterId, isPaid, userEmail }: ConceptDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [concepts, setConcepts] = useState<ConceptNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering any card click/textbook jump
    setIsOpen(true);
    if (concepts === null) {
      setLoading(true);
      getConceptsForCluster(topicClusterId)
        .then((data) => setConcepts(data))
        .catch(() => setConcepts([]))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      // Block screenshot/copy shortcut combinations (Cmd/Ctrl + C, P, S, etc.)
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 's', 'p'].includes(e.key)) {
        e.preventDefault();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold border-zinc-200 text-zinc-600 hover:border-violet-400 hover:bg-violet-50/30 hover:text-violet-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/10 dark:hover:text-violet-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        title="Show psychology concepts tested by this question"
      >
        <span aria-hidden="true">🧠</span>
        Concepts
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-slide-in {
              animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-fade-in {
              animation: fadeIn 0.2s ease-out forwards;
            }
          `}} />

          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Pane */}
          <div
            ref={drawerRef}
            className="relative h-full w-full max-w-lg bg-zinc-50 dark:bg-zinc-950 shadow-2xl animate-slide-in border-l border-zinc-200 dark:border-zinc-800 flex flex-col select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Psychology Concepts</h3>
                  <p className="text-xs text-zinc-500">Tested in this question cluster</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                aria-label="Close drawer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
              {/* Central Background Watermark */}
              {userEmail && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03] select-none z-0">
                  <span className="text-2xl font-black tracking-widest text-zinc-950 dark:text-white uppercase select-none" style={{ transform: 'rotate(-25deg)' }}>
                    {userEmail} · TOPPER101.COM
                  </span>
                </div>
              )}

              <div className="relative z-10 space-y-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-violet-600 border-t-transparent" />
                    <span className="text-sm font-medium text-zinc-500">Loading concept mapping…</span>
                  </div>
                ) : concepts === null || concepts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
                    <span className="text-3xl">🧩</span>
                    <h4 className="mt-3 font-bold text-zinc-700 dark:text-zinc-300">Concept map coming soon</h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      The concept tree for this topic is being built. Check back after the next content pipeline run.
                    </p>
                  </div>
                ) : (
                  concepts.map((concept, idx) => (
                    <DrawerConceptCard
                      key={concept.id}
                      concept={concept}
                      isPaid={isPaid}
                      userEmail={userEmail}
                      defaultExpanded={idx === 0}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Footer Upgrade Prompt (For free tier users) */}
            {!isPaid && (
              <div className="border-t border-zinc-200 bg-amber-50/50 p-6 dark:border-zinc-800 dark:bg-amber-950/10">
                <div className="flex gap-3">
                  <span className="text-xl">🔒</span>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Free Tier Preview Mode</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Layer 3+ concepts are locked. Key theorists and clinical relevance details are gated. Use credits to unlock the subject and complete syllabus mappings.
                    </p>
                    <Link
                      href={ROUTES.pricing}
                      className="inline-block rounded-xl bg-gradient-to-r from-teal-700 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Unlock All Content
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface DrawerConceptCardProps {
  concept: ConceptNode;
  isPaid: boolean;
  userEmail: string | null;
  defaultExpanded?: boolean;
}

function DrawerConceptCard({ concept, isPaid, userEmail, defaultExpanded = false }: DrawerConceptCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isLocked = !isPaid && concept.layer >= 3;
  const isActive = isHovered || isFocused;

  return (
    <div
      ref={cardRef}
      tabIndex={isLocked ? -1 : 0}
      onFocus={() => {
        if (!isLocked) setIsFocused(true);
      }}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => {
        if (!isLocked) setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className={`group/card relative rounded-2xl border transition-all duration-300 bg-white dark:bg-zinc-900/30 overflow-hidden outline-none ${
        isLocked
          ? 'border-zinc-200 opacity-60 grayscale dark:border-zinc-800'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-400/80 dark:hover:border-violet-800/80 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500'
      }`}
    >
      {/* Card Header (Always visible, toggle click) */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => {
          if (!isLocked) setIsExpanded(!isExpanded);
        }}
      >
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover/card:text-violet-700 dark:group-hover/card:text-violet-400 transition-colors">
              {concept.name}
            </h4>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getLayerColor(concept.layer)}`}>
              Layer {concept.layer}
            </span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {concept.domain}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {concept.exam_relevance && (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TIER_COLORS[concept.exam_relevance] ?? TIER_COLORS.LOW}`}>
              {concept.exam_relevance} TEE
            </span>
          )}
          {!isLocked ? (
            <svg
              className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-violet-500' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <span className="text-sm">🔒</span>
          )}
        </div>
      </div>

      {/* Card Details (Collapsible & Protected content) */}
      {isExpanded && !isLocked && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4 relative bg-zinc-50/50 dark:bg-zinc-950/20">
          {/* Dynamic Active-state Protected view */}
          {isActive ? (
            <>
              {/* Extra Layer Watermark on active details */}
              {userEmail && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.04] select-none z-0">
                  <span className="text-[11px] font-bold tracking-wider text-zinc-950 dark:text-white uppercase select-none" style={{ transform: 'rotate(-15deg)' }}>
                    {userEmail} · topper101.com
                  </span>
                </div>
              )}

              <div className="relative z-10 space-y-3.5">
                {/* Definition */}
                {concept.definition && (
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Definition</h5>
                    <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 select-none">
                      {concept.definition}
                    </p>
                  </div>
                )}

                {/* Answer Hook */}
                {concept.sample_answer_hook && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/20 p-3 dark:border-violet-950/40 dark:bg-violet-950/10">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Answer hook / Essay structure
                    </div>
                    <p className="text-xs italic text-zinc-700 dark:text-zinc-300 leading-relaxed select-none">
                      &ldquo;{concept.sample_answer_hook}&rdquo;
                    </p>
                  </div>
                )}

                {/* Theorists and Clinical relevance */}
                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  {/* Theorists */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Key Theories / Theorists</h5>
                    {concept.key_theorists && concept.key_theorists.length > 0 && isPaid ? (
                      <div className="flex flex-wrap gap-1">
                        {concept.key_theorists.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : concept.key_theorists && concept.key_theorists.length > 0 ? (
                      <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <span>🔒 Gated</span>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-zinc-400">None specified</p>
                    )}
                  </div>

                  {/* Clinical Relevance */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Clinical Relevance</h5>
                    {concept.clinical_relevance && isPaid ? (
                      <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {concept.clinical_relevance}
                      </p>
                    ) : concept.clinical_relevance ? (
                      <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <span>🔒 Gated</span>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-zinc-400">None specified</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                ✨ Hover or focus to reveal details
              </p>
            </div>
          )}
        </div>
      )}

      {/* Locked card message (Always rendered in collapsed state if locked) */}
      {isLocked && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-100/50 dark:bg-zinc-950/40 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            🔒 Layer 3+ concept locked on Free Tier.
          </p>
          <Link
            href={ROUTES.pricing}
            className="mt-1.5 inline-block text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            Upgrade to view →
          </Link>
        </div>
      )}
    </div>
  );
}
