'use client';

import { useState, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { getAnswer, updateProgress, submitFlag } from '../../actions';

interface Question {
  id: string;
  year: number;
  session: string;
  section: string;
  question_text: string;
  marks: number;
  answer_status?: string;
  course_id?: string;
}

interface QuestionCardProps {
  question: Question;
  courseCode?: string;
  isPaid?: boolean;
  frequencyTier?: string;
}

export default function QuestionCard({ question, courseCode = '', isPaid = false, frequencyTier = 'LOW' }: QuestionCardProps) {
  const posthog = usePostHog();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<any>(null);
  const [status, setStatus] = useState<'reviewed' | 'bookmarked' | 'skipped' | null>(null);

  // Thumbs state
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);

  // Flag form state
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagType, setFlagType] = useState('Factual error');
  const [flagDesc, setFlagDesc] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagDone, setFlagDone] = useState(false);

  const handleSeeAnswer = async () => {
    // Track question viewed
    posthog?.capture('question_viewed', {
      course_code: courseCode,
      question_id: question.id,
      frequency_tier: frequencyTier,
      is_paid: isPaid,
    });

    setIsOpen(true);
    if (!answerData) {
      setLoading(true);
      try {
        const result = await getAnswer(question.id);
        setAnswerData(result);

        if (result?.status === 'paywall') {
          posthog?.capture('paywall_shown', {
            trigger_point: result.trigger || 'credit_limit',
            course_code: courseCode,
          });
        } else if (result?.status === 'success') {
          posthog?.capture('ai_answer_viewed', {
            course_code: courseCode,
            question_id: question.id,
            plan_tier: isPaid ? 'paid' : 'free',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (newStatus: 'reviewed' | 'bookmarked' | 'skipped') => {
    setStatus(newStatus);
    posthog?.capture('question_marked', {
      question_id: question.id,
      status: newStatus,
    });
    await updateProgress(question.id, newStatus);
  };

  const handleFlagSubmit = async () => {
    setFlagSubmitting(true);
    try {
      await submitFlag(question.id, flagType, flagDesc);
      posthog?.capture('content_flagged', {
        question_id: question.id,
        flag_type: flagType,
      });
      setFlagDone(true);
      setShowFlagForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setFlagSubmitting(false);
    }
  };

  // If question is under review, show badge instead of normal card
  if (question.answer_status === 'under_review') {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider mb-4">
          {(question.session || question.year) && (
            <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {[question.session, question.year].filter(Boolean).join(' ')}
            </span>
          )}
          <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 dark:bg-teal-900/30">
            {question.section ? `Section ${question.section} · ` : ''}{question.marks} Marks
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
            ⚠️ Under Review
          </span>
        </div>

        <p className="text-lg font-medium leading-snug dark:text-white">
          {question.question_text}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-zinc-900 dark:text-amber-400">
          🔍 <strong>Under Review</strong> — Our team is checking this answer. It will be back shortly.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-teal-700/50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider mb-4">
          {(question.session || question.year) && (
            <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {[question.session, question.year].filter(Boolean).join(' ')}
            </span>
          )}
          <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 dark:bg-teal-900/30">
            {question.section ? `Section ${question.section} · ` : ''}{question.marks} Marks
          </span>
        </div>
        
        <p className="text-lg font-medium leading-snug dark:text-white">
          {question.question_text}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => handleStatusChange('reviewed')}
              className={`h-10 w-10 flex items-center justify-center rounded-full border transition-all ${status === 'reviewed' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-200 text-zinc-400 hover:border-emerald-500 hover:text-emerald-500 dark:border-zinc-800'}`}
              title="Mark as Reviewed"
            >
              ✅
            </button>
            <button 
              onClick={() => handleStatusChange('bookmarked')}
              className={`h-10 w-10 flex items-center justify-center rounded-full border transition-all ${status === 'bookmarked' ? 'bg-amber-500 border-amber-500 text-white' : 'border-zinc-200 text-zinc-400 hover:border-amber-500 hover:text-amber-500 dark:border-zinc-800'}`}
              title="Bookmark"
            >
              🔖
            </button>
          </div>
          
          <button 
            onClick={handleSeeAnswer}
            className="rounded-full bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
          >
            See Answer →
          </button>
        </div>
      </div>

      {/* Answer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
              <h2 className="text-xl font-bold dark:text-white">AI Model Answer</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
                  <p className="text-zinc-500 font-medium">Generating your answer...</p>
                </div>
              ) : answerData?.status === 'paywall' ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-6 block">💳</span>
                  <h3 className="text-2xl font-bold dark:text-white">You've used your 5 free answers</h3>
                  <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                    Upgrade to Topper Pass to get unlimited AI answers for all papers and sessions.
                  </p>
                  <div className="mt-10 flex flex-col gap-4">
                    <button className="rounded-full bg-teal-700 px-8 py-4 text-lg font-bold text-white hover:bg-teal-600 shadow-xl shadow-teal-700/20">
                      Unlock All Answers → ₹299
                    </button>
                    <button 
                      className="text-sm font-medium text-zinc-500 hover:text-teal-700"
                      onClick={() => {
                        const link = `${window.location.origin}?ref=referral`;
                        navigator.clipboard.writeText(link);
                        posthog?.capture('referral_link_shared', { channel: 'copy' });
                      }}
                    >
                      Or invite 2 friends for a free month
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {answerData?.creditsRemaining !== undefined && (
                    <div className="rounded-xl bg-teal-50 p-4 text-xs font-bold text-teal-700 dark:bg-teal-900/30">
                      💡 {answerData.creditsRemaining} free answers left this month
                    </div>
                  )}
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap dark:text-zinc-300">
                      {answerData?.answer || "No answer found for this question."}
                    </div>
                  </div>

                  {/* Source attribution */}
                  <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                    </svg>
                    <span>
                      AI-generated answer based on IGNOU MAPC syllabus and past paper patterns. Not sourced from official IGNOU study material. Always cross-check with your course books.
                    </span>
                  </div>
                  
                  {/* Feedback Row */}
                  <div className="mt-10 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                    
                    {/* Thumbs + Flag */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setThumbs('up')}
                          className={`flex items-center gap-1 transition-colors ${thumbs === 'up' ? 'text-emerald-600 font-bold' : 'text-zinc-500 hover:text-emerald-500'}`}
                        >
                          👍 Helpful
                        </button>
                        <button 
                          onClick={() => setThumbs('down')}
                          className={`flex items-center gap-1 transition-colors ${thumbs === 'down' ? 'text-red-600 font-bold' : 'text-zinc-500 hover:text-red-500'}`}
                        >
                          👎 Not helpful
                        </button>
                        {!flagDone && (
                          <button 
                            onClick={() => setShowFlagForm(!showFlagForm)}
                            className="flex items-center gap-1 text-zinc-400 hover:text-red-500 transition-colors text-xs"
                          >
                            🚩 Flag an error
                          </button>
                        )}
                        {flagDone && (
                          <span className="text-xs font-medium text-emerald-600">✅ Flag submitted. Thank you!</span>
                        )}
                      </div>
                      <div className="text-zinc-400">
                        Approx. {answerData?.answer?.split(' ').length || 0} words
                      </div>
                    </div>

                    {/* Inline Flag Form */}
                    {showFlagForm && !flagDone && (
                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Report an issue with this answer</h4>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                            Issue type
                          </label>
                          <select
                            value={flagType}
                            onChange={(e) => setFlagType(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                          >
                            <option value="Factual error">Factual error</option>
                            <option value="Unclear">Unclear</option>
                            <option value="Incomplete">Incomplete</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                            Description <span className="font-normal normal-case">(optional)</span>
                          </label>
                          <textarea
                            value={flagDesc}
                            onChange={(e) => setFlagDesc(e.target.value)}
                            rows={3}
                            placeholder="Briefly describe what's wrong..."
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleFlagSubmit}
                            disabled={flagSubmitting}
                            className="rounded-full bg-red-600 px-6 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 transition-all active:scale-95"
                          >
                            {flagSubmitting ? 'Submitting...' : 'Submit Flag'}
                          </button>
                          <button
                            onClick={() => setShowFlagForm(false)}
                            className="text-sm text-zinc-400 hover:text-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
