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
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all ${
          open
            ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
            : 'border-zinc-200 text-zinc-600 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-800 dark:text-zinc-400'
        }`}
        title="Show psychology concepts tested by this question"
      >
        <span aria-hidden="true">🧠</span>
        {open ? 'Hide concepts' : 'Concepts'}
      </button>

      {open && (
        <div
          className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 dark:border-violet-900/30 dark:bg-violet-950/10"
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
                <div key={concept.id} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white">{concept.name}</h4>
                    {concept.exam_relevance && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
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
                    <div className="rounded-xl border border-violet-200 bg-white p-3 dark:border-violet-900/30 dark:bg-zinc-900">
                      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        Answer hook
                      </div>
                      <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                        &ldquo;{concept.sample_answer_hook}&rdquo;
                      </p>
                    </div>
                  )}

                  {concept.key_theorists && concept.key_theorists.length > 0 && isPaid && (
                    <div className="flex flex-wrap gap-2">
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
                    <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      🔒 Theorist list · Upgrade to Pass to unlock
                    </div>
                  )}

                  {concept.clinical_relevance && isPaid && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-violet-100 pt-3 dark:border-violet-900/20">
                      <span className="font-semibold">Clinical relevance: </span>
                      {concept.clinical_relevance}
                    </p>
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
