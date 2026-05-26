'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveMockAttempt, type QuestionSlot, type Answer } from './actions';

type MockQuestion = QuestionSlot & {
  ai_answer: string | null;
};

type SelfGrade = 'strong' | 'adequate' | 'needs_work';

const TOTAL_SECONDS = 180 * 60;

const SECTION_CONFIG = {
  A: { label: 'Section A', marks: 10, description: 'Attempt any 2 out of 5 questions (10 marks each)' },
  B: { label: 'Section B', marks: 6, description: 'Attempt any 4 out of 8 questions (6 marks each)' },
  C: { label: 'Section C', marks: 3, description: 'Attempt any 6 out of 10 questions (3 marks each)' },
} as const;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function gradeLabel(grade: SelfGrade) {
  if (grade === 'strong') return 'Strong';
  if (grade === 'adequate') return 'Adequate';
  return 'Needs Work';
}

function gradeClasses(grade: SelfGrade) {
  if (grade === 'strong') return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300';
  if (grade === 'adequate') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
}

export default function MockTestRunner({
  courseId,
  courseCode,
  courseName,
  sections,
}: {
  courseId: string;
  courseCode: string;
  courseName: string;
  sections: { A: MockQuestion[]; B: MockQuestion[]; C: MockQuestion[] };
}) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, SelfGrade>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allQuestions: MockQuestion[] = [
    ...sections.A,
    ...sections.B,
    ...sections.C,
  ];

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitted) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);

    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    const slots: QuestionSlot[] = allQuestions.map((q) => ({
      question_id: q.question_id,
      question_text: q.question_text,
      section: q.section,
      marks: q.marks,
    }));
    const answerPayload: Answer[] = allQuestions.map((q) => ({
      question_id: q.question_id,
      answer_text: answers[q.question_id] ?? '',
      self_grade: (grades[q.question_id] as SelfGrade) ?? null,
    }));

    setSaving(true);
    try {
      await saveMockAttempt(courseId, slots, answerPayload, timeTaken);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save attempt');
    } finally {
      setSaving(false);
    }

    if (autoSubmit) {
      // scroll to review panel
      document.getElementById('review-panel')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [submitted, allQuestions, answers, grades, courseId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleSubmit]);

  const isLow = timeLeft < 30 * 60;

  return (
    <div className="space-y-8">
      {/* Sticky timer bar */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mock Test</span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">{courseCode} · {courseName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-mono font-bold tabular-nums ${isLow ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {formatTime(timeLeft)}
            {isLow && <span className="ml-2 text-xs font-bold animate-pulse">LOW TIME</span>}
          </div>
          {!submitted && (
            <button
              onClick={() => handleSubmit(false)}
              className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700 transition-colors"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!submitted && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 space-y-1">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Instructions</p>
          <ul className="list-disc list-inside text-sm text-zinc-500 dark:text-zinc-400 space-y-0.5">
            <li>Total time: 3 hours (180 minutes)</li>
            <li>Section A — answer any <strong>2</strong> of 5 questions (10 marks each)</li>
            <li>Section B — answer any <strong>4</strong> of 8 questions (6 marks each)</li>
            <li>Section C — answer any <strong>6</strong> of 10 questions (3 marks each)</li>
            <li>Type your answers below. You can self-grade after submission.</li>
          </ul>
        </div>
      )}

      {/* Question sections */}
      {(['A', 'B', 'C'] as const).map((sec) => (
        <section key={sec} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold dark:text-white">{SECTION_CONFIG[sec].label}</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{SECTION_CONFIG[sec].description}</span>
          </div>

          <div className="space-y-4">
            {sections[sec].map((q, idx) => (
              <div
                key={q.question_id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">
                    <span className="text-zinc-400 mr-2">{idx + 1}.</span>
                    {q.question_text}
                  </p>
                  <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {q.marks} marks
                  </span>
                </div>

                {!submitted ? (
                  <textarea
                    placeholder="Write your answer here…"
                    rows={6}
                    value={answers[q.question_id] ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.question_id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Submit button (bottom) */}
      {!submitted && (
        <div className="flex justify-end pt-4">
          <button
            onClick={() => handleSubmit(false)}
            className="rounded-full bg-teal-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-teal-700 transition-colors"
          >
            Submit Test
          </button>
        </div>
      )}

      {/* Review panel */}
      {submitted && (
        <div id="review-panel" className="space-y-6 pt-4">
          <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10 p-5">
            <h2 className="text-xl font-bold text-teal-800 dark:text-teal-200">Test Submitted</h2>
            <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
              Review your answers against the model answers and self-grade each question.
              {saving && ' Saving your attempt…'}
              {saveError && <span className="text-red-600 ml-2">{saveError}</span>}
            </p>
          </div>

          {(['A', 'B', 'C'] as const).map((sec) => (
            <section key={sec} className="space-y-4">
              <h3 className="text-base font-bold dark:text-white">{SECTION_CONFIG[sec].label} — Review</h3>
              {sections[sec].map((q, idx) => {
                const myAnswer = answers[q.question_id] ?? '';
                const grade = grades[q.question_id] as SelfGrade | undefined;
                return (
                  <div
                    key={q.question_id}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
                  >
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">
                      <span className="text-zinc-400 mr-2">{idx + 1}.</span>
                      {q.question_text}
                      <span className="ml-2 text-xs font-normal text-zinc-400">({q.marks} marks)</span>
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Student answer */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Answer</p>
                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-sm text-zinc-700 dark:text-zinc-300 min-h-[80px] whitespace-pre-wrap">
                          {myAnswer.trim() || <span className="italic text-zinc-400">No answer written</span>}
                        </div>
                      </div>

                      {/* Model answer */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">Model Answer</p>
                        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-900/10 p-3 text-sm text-zinc-700 dark:text-zinc-300 min-h-[80px] whitespace-pre-wrap">
                          {q.ai_answer?.trim() || <span className="italic text-zinc-400">Model answer not yet available</span>}
                        </div>
                      </div>
                    </div>

                    {/* Self-grade */}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Self-grade:</span>
                      {(['strong', 'adequate', 'needs_work'] as SelfGrade[]).map((g) => (
                        <button
                          key={g}
                          onClick={() =>
                            setGrades((prev) => ({ ...prev, [q.question_id]: g }))
                          }
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            grade === g
                              ? gradeClasses(g)
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {gradeLabel(g)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          <div className="flex justify-start pt-2">
            <a
              href={`/courses/${courseCode}`}
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              ← Back to {courseCode}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
