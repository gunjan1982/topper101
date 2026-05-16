'use client';

import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import AnswerRenderer from '@/components/AnswerRenderer';

interface QuestionDetails {
  question_text: string;
  marks: number;
  block_ref?: string | null;
  chapter_ref?: string | null;
  page_ref?: string | null;
}

interface ExistingAnswer {
  answer_text: string;
  word_count: number;
}

interface AssignmentQuestionCardProps {
  question: QuestionDetails;
  questionIndex: number;
  assignmentId: string;
  userPlanTier: 'free' | 'pass' | 'pro';
  existingAnswer: ExistingAnswer | null;
  courseCode: string;
  assignmentYear: number;
}

export default function AssignmentQuestionCard({
  question,
  questionIndex,
  assignmentId,
  userPlanTier,
  existingAnswer: initialAnswer,
  courseCode,
  assignmentYear,
}: AssignmentQuestionCardProps) {
  const posthog = usePostHog();
  const [answer, setAnswer] = useState<ExistingAnswer | null>(initialAnswer);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initial view of existing cached answers
  useEffect(() => {
    if (initialAnswer) {
      posthog?.capture('assignment_answer_viewed', {
        course_code: courseCode,
        assignment_year: assignmentYear,
        question_index: questionIndex,
        plan_tier: userPlanTier,
      });
    }
  }, [initialAnswer, posthog, courseCode, assignmentYear, questionIndex, userPlanTier]);

  const handleGenerate = async () => {
    if (userPlanTier !== 'pro') return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          question_index: questionIndex,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate answer.');
      }

      setAnswer(data);
      
      // Track successful generation
      posthog?.capture('assignment_answer_generated', {
        course_code: courseCode,
        assignment_year: assignmentYear,
        question_index: questionIndex,
        marks: question.marks,
      });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:border-teal-600/30">
      
      {/* Target Question UI Header Block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <h3 className="text-xl font-medium leading-relaxed dark:text-white">
          <span className="font-bold text-teal-700 dark:text-teal-400 mr-2">Q{questionIndex + 1}.</span> 
          {question.question_text}
        </h3>
        <div className="shrink-0 font-bold rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {question.marks} Marks
        </div>
      </div>

      <div className="mt-8 space-y-6">
        
        {/* Pass Tier / Pro Tier References Display */}
        {userPlanTier !== 'free' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Textbook Reference</span>
            </div>
            {question.block_ref ? (
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Block {question.block_ref} <span className="opacity-40 mx-2">•</span> Chapter {question.chapter_ref} <span className="opacity-40 mx-2">•</span> Page {question.page_ref}
              </p>
            ) : (
              <p className="text-sm text-emerald-600/80 italic dark:text-emerald-400/80">Reference coming soon</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <span className="text-2xl mb-2 block">🔒</span>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Upgrade to Pass to see the textbook reference</p>
          </div>
        )}

        {/* Answer Layout */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          
          {userPlanTier === 'pro' ? (
             answer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-700">AI-written Study Answer</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{answer.word_count} words</span>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                  <div className="font-bold">Source clarity</div>
                  <p className="mt-1">
                    This is AI-written for study and drafting support. It may use the listed textbook reference when available, but it is not an official IGNOU answer or a verbatim textbook extract.
                  </p>
                  <p className="mt-2 text-xs font-bold text-sky-800 dark:text-sky-200">
                    Blue blocks, when present, are extra AI simplifications or examples beyond the core answer.
                  </p>
                </div>
                <AnswerRenderer answer={answer.answer_text} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800 space-y-4">
                 <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="rounded-full bg-teal-700 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-700/20 hover:bg-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Thinking...' : '✨ Generate Model Answer'}
                </button>
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <span className="text-2xl mb-2 block">🔒✨</span>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Upgrade to Pro to generate a model answer</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
