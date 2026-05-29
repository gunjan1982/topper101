'use client';

import { useState } from 'react';
import { approveQuestionAnswer, saveQuestionDraft } from './actions';
import AnswerRenderer from '@/components/AnswerRenderer';

export interface QuestionWithCourse {
  id: string;
  question_text: string;
  marks: number;
  year: number | null;
  session: string | null;
  section: string | null;
  ai_answer: string | null;
  answer_status: string | null;
  reviewed_by_human: boolean;
  textbook_page: number | null;
  textbook_excerpt: string | null;
  courses: {
    code: string;
    name: string;
  } | null;
}

interface QuestionReviewCardProps {
  question: QuestionWithCourse;
}

export default function QuestionReviewCard({ question }: QuestionReviewCardProps) {
  const [currentAnswer, setCurrentAnswer] = useState(question.ai_answer ?? '');
  const [currentPage, setCurrentPage] = useState(question.textbook_page?.toString() ?? '');
  const [currentExcerpt, setCurrentExcerpt] = useState(question.textbook_excerpt ?? '');
  const [reviewed, setReviewed] = useState(question.reviewed_by_human);
  const [status, setStatus] = useState(question.answer_status ?? 'draft');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  const [saving, setSaving] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const courseCode = question.courses?.code ?? '';
  const courseName = question.courses?.name ?? 'Unknown Course';
  
  // Format the TEE details
  const teeDetails = [question.session, question.year].filter(Boolean).join(' ');

  const handleOpenPdf = async () => {
    if (!courseCode) {
      alert('Course code is not available.');
      return;
    }
    setOpeningPdf(true);
    try {
      const res = await fetch(`/api/pdf/textbook/${courseCode}/url`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const pageNum = parseInt(currentPage, 10);
          const pageSuffix = !isNaN(pageNum) ? `#page=${pageNum}` : '';
          window.open(`${data.url}${pageSuffix}`, '_blank');
        } else {
          alert('Could not resolve textbook URL');
        }
      } else {
        alert('Failed to retrieve textbook URL');
      }
    } catch (err) {
      console.error(err);
      alert('Error opening textbook PDF');
    } finally {
      setOpeningPdf(false);
    }
  };

  const handleAction = async (actionType: 'approve' | 'save') => {
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('question_id', question.id);
      formData.append('ai_answer', currentAnswer);
      formData.append('textbook_page', currentPage);
      formData.append('textbook_excerpt', currentExcerpt);
      formData.append('answer_status', actionType === 'approve' ? 'published' : 'draft');

      const res = actionType === 'approve'
        ? await approveQuestionAnswer(formData)
        : await saveQuestionDraft(formData);

      if ('error' in res) {
        setMessage({ type: 'error', text: res.error });
      } else {
        setMessage({
          type: 'success',
          text: actionType === 'approve' ? 'Approved & marked human reviewed!' : 'Draft updates saved.',
        });
        if (actionType === 'approve') {
          setReviewed(true);
          setStatus('published');
        } else {
          setStatus('draft');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:backdrop-blur-sm">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/40 dark:border-teal-800/30 dark:text-teal-400">
            {courseCode}
          </span>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {courseName}
          </span>
          {teeDetails && (
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {teeDetails}
            </span>
          )}
          {question.section && (
            <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Sec {question.section}
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {question.marks} Marks
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {reviewed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Reviewed by Human
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30">
              Unreviewed
            </span>
          )}

          {status === 'published' ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30">
              Published
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/30">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Question text box */}
      <div className="mt-4 bg-zinc-50 border border-zinc-200/60 rounded-xl p-4 text-sm dark:bg-zinc-950/40 dark:border-zinc-800/60">
        <div className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1">Question</div>
        <div className="font-semibold text-zinc-900 dark:text-white leading-relaxed">
          {question.question_text}
        </div>
      </div>

      {/* Side-by-Side Review Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: AI Answer */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">AI Answer</span>
            <div className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setTab('edit')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  tab === 'edit'
                    ? 'bg-white shadow-sm text-zinc-900 dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Edit Raw
              </button>
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  tab === 'preview'
                    ? 'bg-white shadow-sm text-zinc-900 dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Preview Rendered
              </button>
            </div>
          </div>

          {tab === 'edit' ? (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={14}
              placeholder="Paste or write the AI generated answer..."
              className="w-full rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white font-mono leading-relaxed"
            />
          ) : (
            <div className="w-full rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white h-[328px] overflow-y-auto">
              {currentAnswer.trim() ? (
                <AnswerRenderer answer={currentAnswer} />
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600 italic font-medium">No answer text. Click &apos;Edit Raw&apos; to write an answer.</span>
              )}
            </div>
          )}
        </div>

        {/* Right column: Textbook references */}
        <div className="flex flex-col space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={`page-${question.id}`} className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Textbook Page
              </label>
              {courseCode && (
                <button
                  type="button"
                  onClick={handleOpenPdf}
                  disabled={openingPdf}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 disabled:opacity-50 transition-colors"
                >
                  {openingPdf ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-teal-600 border-t-transparent dark:border-teal-400" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  )}
                  Open Textbook PDF
                </button>
              )}
            </div>
            <input
              id={`page-${question.id}`}
              type="number"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              placeholder="e.g. 140"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col flex-1 space-y-2">
            <label htmlFor={`excerpt-${question.id}`} className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Textbook Grounding Excerpt
            </label>
            <textarea
              id={`excerpt-${question.id}`}
              value={currentExcerpt}
              onChange={(e) => setCurrentExcerpt(e.target.value)}
              rows={9}
              placeholder="Paste relevant excerpts from the textbook that ground or substantiate this answer..."
              className="w-full flex-1 rounded-xl border border-zinc-300 bg-white p-4 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Bottom status alert message */}
      {message && (
        <div className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
        }`}>
          {message.type === 'success' ? (
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Action panel footer */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={() => handleAction('save')}
          disabled={saving}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/80 disabled:opacity-50 transition-all duration-200"
        >
          Save Draft Updates
        </button>

        <button
          type="button"
          onClick={() => handleAction('approve')}
          disabled={saving}
          className="relative inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
        >
          {saving && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          Approve & Mark Human Reviewed
        </button>
      </div>
    </div>
  );
}
