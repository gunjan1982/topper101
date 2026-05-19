'use client';

interface QuestionDetails {
  question_text: string;
  marks: number;
  block_ref?: string | null;
  chapter_ref?: string | null;
  page_ref?: string | null;
}

interface AssignmentQuestionCardProps {
  question: QuestionDetails;
  questionIndex: number;
  canViewReference: boolean;
}

export default function AssignmentQuestionCard({
  question,
  questionIndex,
  canViewReference,
}: AssignmentQuestionCardProps) {
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
        
        {/* Reference Display */}
        {canViewReference ? (
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
          <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">AI-generated assignment answers are not available yet.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
