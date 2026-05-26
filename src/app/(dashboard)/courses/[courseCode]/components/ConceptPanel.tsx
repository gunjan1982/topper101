'use client';

import { useState } from 'react';
import { getConceptsForCluster, type ConceptNode } from '../../actions';

interface ConceptPanelProps {
  topicClusterId: string;
  isPaid: boolean;
}

const TIER_COLORS: Record<string, string> = {
  HIGH: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300',
  LOW: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
};

export default function ConceptPanel({ topicClusterId, isPaid }: ConceptPanelProps) {
  const [open, setOpen] = useState(false);
  const [concepts, setConcepts] = useState<ConceptNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger QuestionCard's onClick (textbook jump)
    if (!open && concepts === null) {
      setLoading(true);
      try {
        const data = await getConceptsForCluster(topicClusterId);
        setConcepts(data);
      } catch {
        setConcepts([]);
      } finally {
        setLoading(false);
      }
    }
    setOpen((prev) => !prev);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
          open
            ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-md shadow-violet-100 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300 dark:shadow-none'
            : 'border-zinc-200 text-zinc-600 hover:border-violet-400 hover:bg-violet-50/30 hover:text-violet-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-violet-700 dark:hover:bg-violet-950/10 dark:hover:text-violet-300'
        }`}
        title="Show psychology concepts tested by this question"
      >
        <span aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-12 scale-110' : ''}`}>🧠</span>
        {open ? 'Hide concepts' : 'Concepts'}
      </button>

      {open && (
        <div
          className="mt-4 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/60 to-fuchsia-50/40 p-5 shadow-sm shadow-violet-100/5 dark:border-violet-900/30 dark:from-violet-950/15 dark:to-fuchsia-950/5 dark:shadow-none transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center gap-3 py-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <span className="text-sm text-zinc-500">Loading concepts…</span>
            </div>
          ) : concepts === null || concepts.length === 0 ? (
            <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">Concept map coming soon</p>
              <p>
                The concept tree for this topic is being built. Check back after the next content
                pipeline run.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Psychology concepts tested
              </div>
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="group/card relative space-y-3 rounded-2xl border border-violet-100/50 bg-white/60 p-4 transition-all duration-300 hover:translate-x-0.5 hover:border-violet-300 hover:bg-white hover:shadow-sm dark:border-violet-950/40 dark:bg-zinc-900/30 dark:hover:border-violet-800/50 dark:hover:bg-zinc-900/60 dark:hover:shadow-none"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white transition-colors group-hover/card:text-violet-700 dark:group-hover/card:text-violet-400">
                      {concept.name}
                    </h4>
                    {concept.layer && (
                      <span className="rounded-full border border-violet-200 bg-violet-50/50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-300">
                        Layer {concept.layer}
                      </span>
                    )}
                    {concept.exam_relevance && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          TIER_COLORS[concept.exam_relevance] ?? TIER_COLORS.LOW
                        }`}
                      >
                        {concept.exam_relevance} Frequency
                      </span>
                    )}
                  </div>

                  {concept.definition && (
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {concept.definition}
                    </p>
                  )}

                  {concept.sample_answer_hook && (
                    <div className="rounded-xl border border-violet-100 bg-white/80 p-3 transition-colors group-hover/card:border-violet-200 dark:border-violet-900/30 dark:bg-zinc-950/40 dark:group-hover/card:border-violet-800/50">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        Answer hook
                      </div>
                      <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                        &ldquo;{concept.sample_answer_hook}&rdquo;
                      </p>
                    </div>
                  )}

                  {concept.key_theorists && concept.key_theorists.length > 0 && isPaid && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 self-center">
                        Key theorists:
                      </span>
                      {concept.key_theorists.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {concept.key_theorists && concept.key_theorists.length > 0 && !isPaid && (
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
                      <span>🔒 Theorists list</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">· Upgrade to Pass to unlock</span>
                    </div>
                  )}

                  {concept.clinical_relevance && isPaid && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-violet-100/50 pt-2.5 dark:border-violet-900/20">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Clinical relevance: </span>
                      {concept.clinical_relevance}
                    </div>
                  )}

                  {concept.clinical_relevance && !isPaid && (
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-3 py-1.5 text-xs font-semibold text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
                      <span>🔒 Clinical relevance</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">· Upgrade to Pass to unlock</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
