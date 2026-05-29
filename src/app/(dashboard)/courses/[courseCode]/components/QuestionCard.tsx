'use client';

import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { ROUTES } from '@/lib/routes';
import { cleanQuestionText } from '@/lib/questionDisplay';
import AnswerRenderer from '@/components/AnswerRenderer';
import { getAnswer, updateProgress, submitFlag, trackQuestionViewed } from '../../actions';
import ConceptDrawer from './ConceptDrawer';
import { resolveTextbookPage } from '@/lib/textbookOffsets';


interface Question {
  id: string;
  year: number | null;
  session: string | null;
  section: string | null;
  question_text: string;
  marks: number;
  answer_status?: string | null;
  course_id?: string;
  reviewed_by_human?: boolean | null;
  textbook_grounded?: boolean | null;
}

type AnswerData =
  | { status: 'success'; answer: string; creditsRemaining?: number; textbookGrounded?: boolean }
  | { status: 'paywall'; trigger?: 'subject_locked' | 'credit_limit' }
  | { status: 'missing_answer' };

interface QuestionCardProps {
  question: Question;
  variations?: Array<{
    id: string;
    tee: string;
    section: string | null;
    marks: number;
    text: string;
  }>;
  courseCode?: string;
  isPaid?: boolean;
  referralCode?: string | null;
  userEmail?: string | null;
  frequencyTier?: string;
  initialProgress?: {
    reviewed: boolean;
    bookmarked: boolean;
  };
  textbookPage?: number;
  textbookExcerpt?: string;
  topicClusterId?: string;
  textbookGrounded?: boolean;
  reviewedByHuman?: boolean;
}

function getWordCountLimitForMarks(marks: number) {
  if (marks >= 10) return '450-500 words (curated for 10-mark essay type questions)';
  if (marks >= 5) return '250 words (curated for 5/6-mark short-answer type questions)';
  return '50-80 words (curated for 2/3-mark very short-answer type questions)';
}

export default function QuestionCard({
  question,
  variations = [],
  courseCode = '',
  isPaid = false,
  referralCode = null,
  userEmail = null,
  frequencyTier = 'LOW',
  initialProgress = { reviewed: false, bookmarked: false },
  textbookPage,
  textbookExcerpt,
  topicClusterId,
  textbookGrounded = false,
  reviewedByHuman = false,
}: QuestionCardProps) {
  const posthog = usePostHog();
  const resolvedPage = resolveTextbookPage(courseCode, textbookPage);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<AnswerData | null>(null);
  const [reviewed, setReviewed] = useState(initialProgress.reviewed);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialProgress.bookmarked);
  const displayText = cleanQuestionText(question);
  const teeTags = variations.length > 0
    ? variations.map((variation) => variation.tee)
    : [[question.session, question.year].filter(Boolean).join(' ')];
  const uniqueTeeTags = [...new Set(teeTags)].filter(Boolean);

  // Thumbs state
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);

  // Flag form state
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagType, setFlagType] = useState('error');
  const [flagDesc, setFlagDesc] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagDone, setFlagDone] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  // Answer error state
  const [answerError, setAnswerError] = useState<string | null>(null);

  const isGrounded = textbookGrounded || !!question.textbook_grounded;



  // Block print and save keyboard shortcuts globally
  useEffect(() => {
    const blockShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', blockShortcuts, true);
    return () => window.removeEventListener('keydown', blockShortcuts, true);
  }, []);

  const handleSeeAnswer = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    setAnswerError(null);

    if (!hasTrackedView && courseCode) {
      setHasTrackedView(true);
      posthog?.capture('question_viewed', {
        course_code: courseCode,
        question_id: question.id,
        frequency_tier: frequencyTier,
        is_paid: isPaid,
      });
      trackQuestionViewed(question.id, courseCode).catch(() => {});
    }
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
      } catch (error: unknown) {
        console.error(error);
        setAnswerError(error instanceof Error ? error.message : 'Failed to load answer. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProgressToggle = async (newStatus: 'reviewed' | 'bookmarked') => {
    const nextActive = newStatus === 'reviewed' ? !reviewed : !bookmarked;

    if (newStatus === 'reviewed') {
      setReviewed(nextActive);
    } else {
      setBookmarked(nextActive);
    }

    posthog?.capture('question_marked', {
      question_id: question.id,
      status: newStatus,
      active: nextActive,
    });

    try {
      await updateProgress(question.id, newStatus, nextActive);
    } catch (error) {
      if (newStatus === 'reviewed') {
        setReviewed(!nextActive);
      } else {
        setBookmarked(!nextActive);
      }
      console.error(error);
    }
  };

  const handleCardClick = () => {
    window.dispatchEvent(new CustomEvent('textbookJump', {
      detail: {
        page: (textbookPage && textbookPage > 0) ? textbookPage : null,
        excerpt: textbookExcerpt ?? null,
      },
    }));

    if (!hasTrackedView && courseCode) {
      setHasTrackedView(true);
      posthog?.capture('question_viewed', {
        course_code: courseCode,
        question_id: question.id,
        frequency_tier: frequencyTier,
        is_paid: isPaid,
      });
      trackQuestionViewed(question.id, courseCode).catch(() => {});
    }
  };

  const handleFlagSubmit = async () => {
    setFlagSubmitting(true);
    setFlagError(null);
    try {
      await submitFlag(question.id, flagType, flagDesc);
      posthog?.capture('content_flagged', {
        question_id: question.id,
        flag_type: flagType,
      });
      setFlagDone(true);
      setShowFlagForm(false);
    } catch (err: unknown) {
      console.error(err);
      setFlagError(err instanceof Error ? err.message : 'Failed to submit flag. Please try again.');
    } finally {
      setFlagSubmitting(false);
    }
  };

  // If question is under review, show badge instead of normal card
  if (question.answer_status === 'under_review') {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider mb-4">
          {uniqueTeeTags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {tag}
            </span>
          ))}
          {uniqueTeeTags.length > 4 && (
            <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              +{uniqueTeeTags.length - 4} TEEs
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
          {displayText}
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-700 dark:border-amber-900/30 dark:bg-zinc-900 dark:text-amber-400">
          🔍 <strong>Under Review</strong> — Our team is checking this answer. It will be back shortly.
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleCardClick} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-teal-700/50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider mb-4">
          {uniqueTeeTags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {tag}
            </span>
          ))}
          {uniqueTeeTags.length > 4 && (
            <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              +{uniqueTeeTags.length - 4} TEEs
            </span>
          )}
          <span className="rounded bg-teal-50 px-2 py-1 text-teal-700 dark:bg-teal-900/30">
            {question.section ? `Section ${question.section} · ` : ''}{question.marks} Marks
          </span>
          {variations.length > 1 && (
            <span className="rounded bg-violet-50 px-2 py-1 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              Repeated {variations.length} times
            </span>
          )}
        </div>
        
        <p className="text-lg font-medium leading-snug dark:text-white">
          {displayText}
        </p>

        {variations.length > 1 && (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black/20">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
              TEE variations
            </div>
            <div className="space-y-3">
              {variations.map((variation) => {
                const sameText = variation.text === displayText;

                return (
                  <div key={variation.id} className="grid gap-2 text-sm sm:grid-cols-[180px_1fr]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-zinc-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {variation.tee}
                      </span>
                      <span className="rounded bg-teal-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">
                        {variation.section ? `Section ${variation.section} · ` : ''}{variation.marks} marks
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {sameText ? 'Same framing' : variation.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Progress
            </span>
            <button 
              onClick={() => handleProgressToggle('reviewed')}
              aria-pressed={reviewed}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all ${
                reviewed
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-zinc-200 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-400'
              }`}
              title="Mark this question as reviewed for progress tracking"
            >
              <span aria-hidden="true">✓</span>
              {reviewed ? 'Reviewed' : 'Mark reviewed'}
            </button>
            <button 
              onClick={() => handleProgressToggle('bookmarked')}
              aria-pressed={bookmarked}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all ${
                bookmarked
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-zinc-200 text-zinc-600 hover:border-amber-500 hover:text-amber-600 dark:border-zinc-800 dark:text-zinc-400'
              }`}
              title="Save this question for quick revision later"
            >
              <span aria-hidden="true">☆</span>
              {bookmarked ? 'Saved' : 'Save for later'}
            </button>
            {topicClusterId && (
              <ConceptDrawer topicClusterId={topicClusterId} isPaid={isPaid} userEmail={userEmail} />
            )}
          </div>
          
          <button 
            onClick={handleSeeAnswer}
            className="rounded-full bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 transition-all active:scale-95"
          >
            {isOpen ? 'Hide Answer ↑' : 'See Answer →'}
          </button>
          {isGrounded && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
              📖 Textbook-verified
            </span>
          )}
          {textbookPage && textbookPage > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400 font-semibold">
              📚 Jump to {resolvedPage?.displayLabel ?? `Page ${textbookPage}`}
            </span>
          )}
        </div>

        {/* Inline Answer */}
        {isOpen && (
          <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <div className="mb-4">
              <h3 className="text-base font-bold dark:text-white">
                {answerData?.status === 'success' && (answerData.textbookGrounded || isGrounded)
                  ? '📚 Textbook-Grounded Answer'
                  : 'Curated Exam Answer'}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {answerData?.status === 'success' && (answerData.textbookGrounded || isGrounded)
                  ? 'Sourced from the IGNOU prescribed textbook for this course'
                  : 'Curated from MAPC syllabus context and past-paper analysis'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-teal-700 dark:bg-teal-900/30">
                  📝 Target Word Count: {getWordCountLimitForMarks(question.marks)}
                </span>
                {(isGrounded || reviewedByHuman) && (
                  <>
                    {(isGrounded && textbookPage) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-white shadow-md dark:from-emerald-700 dark:to-teal-700">
                        📖 Verified Textbook Grounded ({resolvedPage?.displayLabel ?? `Page ${textbookPage}`})
                      </span>
                    ) : (

                      isGrounded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-teal-600 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-400/20">
                          📖 Textbook-grounded answer
                        </span>
                      )
                    )}
                    {reviewedByHuman && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-teal-600 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-400/20">
                        ✓ Reviewed by Gunjan
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
                <p className="text-zinc-500 font-medium">Retrieving curated answer...</p>
              </div>
            ) : answerError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200 text-center space-y-4">
                <h3 className="font-bold">⚠️ Failed to load answer</h3>
                <p className="text-sm">
                  {answerError}
                </p>
                <button
                  onClick={handleSeeAnswer}
                  className="rounded-full bg-red-600 px-6 py-2 text-xs font-bold text-white hover:bg-red-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : answerData?.status === 'paywall' ? (
              <div className="text-center py-8">
                <span className="text-6xl mb-6 block">💳</span>
                <h3 className="text-2xl font-bold dark:text-white">
                  {answerData.trigger === 'subject_locked'
                    ? 'This paper is locked'
                    : 'You have used your free answers'}
                </h3>
                <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                  {answerData.trigger === 'subject_locked'
                    ? 'Your first paper is free. Upgrade to unlock this subject, or pick the 5-subject Pass for this TEE.'
                    : 'Upgrade to Topper Pass to get Textbook word count specific curated answers powered by AI for unlocked subjects.'}
                </p>
                <div className="mt-10 flex flex-col gap-4">
                  <button
                    onClick={() => {
                      window.location.href = ROUTES.pricing;
                    }}
                    className="rounded-full bg-teal-700 px-8 py-4 text-lg font-bold text-white hover:bg-teal-600 shadow-xl shadow-teal-700/20"
                  >
                    Unlock This Subject - ₹99
                  </button>
                  <button 
                    className="text-sm font-medium text-zinc-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      const link = `${window.location.origin}${ROUTES.signup}?ref=${encodeURIComponent(referralCode ?? '')}`;
                      navigator.clipboard.writeText(link);
                      posthog?.capture('referral_link_shared', { channel: 'copy' });
                    }}
                    disabled={!referralCode}
                  >
                    Or invite a friend to unlock another paper
                  </button>
                </div>
              </div>
            ) : answerData?.status === 'missing_answer' ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-200">
                <h3 className="font-bold">Answer coming soon</h3>
                <p className="mt-2 text-sm">
                  This question is available in the bank, but the model answer has not been reviewed or loaded yet. Your free credits were not used.
                </p>
              </div>
            ) : (
              <div
                className="relative space-y-6 select-none"
                onContextMenu={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 's', 'p'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              >
                {answerData?.creditsRemaining !== undefined && (
                  <div className="rounded-xl bg-teal-50 p-4 text-xs font-bold text-teal-700 dark:bg-teal-900/30">
                    💡 {answerData.creditsRemaining} free answers left this month
                  </div>
                )}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                  <div className="font-bold">Source</div>
                  <p className="mt-1">
                    {answerData?.status === 'success' && (answerData.textbookGrounded || isGrounded)
                      ? '✅ This answer is sourced from the IGNOU prescribed textbook for this course, structured for exam clarity.'
                      : '📝 This answer was curated using MAPC syllabus context and past-paper analysis. It has not been verified against the IGNOU textbook.'}
                  </p>
                </div>

                {(isGrounded && textbookPage) && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md dark:from-emerald-700 dark:to-teal-700">
                    📖 Verified Textbook Grounded ({resolvedPage?.displayLabel ?? `Page ${textbookPage}`})
                  </div>
                )}


                <AnswerRenderer answer={answerData?.answer || 'No answer found for this question.'} />

                {/* Email watermark — discourages screenshots and unauthorised sharing */}
                {userEmail && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.04]"
                    aria-hidden="true"
                  >
                    <span
                      className="select-none whitespace-nowrap text-xl font-bold text-zinc-950 dark:text-white"
                      style={{ transform: 'rotate(-30deg)', letterSpacing: '0.05em' }}
                    >
                      {userEmail} · topper101.com
                    </span>
                  </div>
                )}

                {/* Source attribution */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  <span>
                    Use this as a revision aid. For final exam preparation, cross-check facts, definitions, and theorists with your IGNOU course books.
                  </span>
                </div>
                
                {/* Feedback Row */}
                <div className="mt-10 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  {/* Thumbs + Flag */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm">
                    <div className="flex flex-wrap items-center gap-4">
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
                    <div className="text-zinc-400 self-start sm:self-auto">
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
                          <option value="error">Factual error</option>
                          <option value="unclear">Unclear</option>
                          <option value="incomplete">Incomplete</option>
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

                      {flagError && (
                        <p className="text-xs font-bold text-red-500">
                          ⚠️ Error: {flagError}
                        </p>
                      )}

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
        )}
      </div>
    );
}
