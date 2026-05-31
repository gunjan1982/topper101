'use client';

import { useState } from 'react';
import { updateSettings, setUrnaOptIn } from './actions';
import { MAPC_STREAMS, isTheoryCourse, normalizeStream } from '@/lib/courseCatalog';
import { formatExamDate, getExamSchedule } from '@/lib/examSchedule';
import { verifyStudentDocument } from '@/app/onboarding/actions';

interface Course {
  id: string;
  code: string;
  name: string;
  year: number;
  stream: string | null;
  course_type: 'theory' | 'practical' | 'internship' | 'project';
}

interface SettingsFormProps {
  initialYear: number;
  initialStream: string | null;
  initialPhone: string;
  initialPapers: string[];
  initialUrnaOptIn: boolean;
  initialVerification: {
    status: 'verified' | 'pending' | 'rejected' | null;
    document_type: 'admit_card' | 'id_card' | null;
    enrollment_number: string | null;
  } | null;
  allCourses: Course[];
}

const paperFilters = ['All', 'Year 1', 'Clinical', 'Counselling', 'Organisational', 'Common'] as const;

export default function SettingsForm({
  initialYear,
  initialStream,
  initialPhone,
  initialPapers,
  initialUrnaOptIn,
  initialVerification,
  allCourses,
}: SettingsFormProps) {
  const [year, setYear] = useState<number>(initialYear);
  const [stream, setStream] = useState<string | null>(initialStream);
  const [phone, setPhone] = useState(initialPhone);
  const [paperFilter, setPaperFilter] = useState<(typeof paperFilters)[number]>('All');
  const [selectedPapers, setSelectedPapers] = useState<string[]>(initialPapers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urnaOptIn, setUrnaOptInState] = useState(initialUrnaOptIn);
  const [urnaLoading, setUrnaLoading] = useState(false);

  // Student verification states
  const [verification, setVerification] = useState(initialVerification);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);
    setUploadPending(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await verifyStudentDocument(formData);
      if (res.status === 'error') {
        setUploadError(res.message || 'Verification failed');
      } else {
        setVerification({
          status: 'verified',
          document_type: res.document_type as 'admit_card' | 'id_card',
          enrollment_number: res.enrollment_number ?? null
        });
        setUploadSuccess(
          res.document_type === 'admit_card'
            ? 'Admit card verified successfully! Your papers are configured and your 1st subject free credit is active.'
            : 'Student ID card verified successfully! You can select your papers manually below.'
        );
        if (res.document_type === 'admit_card' && res.papers) {
          setSelectedPapers(res.papers);
          if (res.year) setYear(res.year);
          if (res.stream) setStream(res.stream);
        }
      }
    } catch {
      setUploadError('An unexpected error occurred during upload.');
    } finally {
      setUploadPending(false);
    }
  };

  const theoryCourses = allCourses
    .filter((course) => isTheoryCourse(course))
    .sort((a, b) => a.code.localeCompare(b.code));

  const visibleCourses = theoryCourses.filter((course) => {
    if (paperFilter === 'All') return true;
    if (paperFilter === 'Year 1') return course.year === 1;
    return normalizeStream(course.stream) === normalizeStream(paperFilter);
  });

  const togglePaper = (code: string) => {
    setSelectedPapers((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setError(null);
    if (year === 2 && !stream) {
      setError('Please select a stream before saving.');
      return;
    }
    if (selectedPapers.length === 0) {
      setError('Select at least one paper for your dashboard.');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ year, stream, phone, papers: selectedPapers });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Student Verification Card */}
      <section className="space-y-4 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div>
          <h2 className="text-lg font-bold dark:text-white">Student Verification</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Verify your IGNOU student status to unlock a free subject credit.
          </p>
        </div>

        {verification && verification.status === 'verified' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4 dark:border-emerald-900/20 dark:bg-emerald-950/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Verified IGNOU MAPC Student
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  Document: {verification.document_type === 'admit_card' ? 'Admit Card (Hall Ticket)' : 'Student ID Card'} 
                  {verification.enrollment_number && ` · Enrollment No: ${verification.enrollment_number}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 dark:border-amber-900/20 dark:bg-amber-950/10">
              <p className="text-xs text-amber-800 dark:text-amber-400 leading-normal">
                ⚠️ <strong>Unverified status</strong>: You can select subjects manually, but answer generation and prep helpers will remain locked until verified. Upload your Admit Card or ID Card to unlock one subject free.
              </p>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <label className="flex-1 block">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Select Card Image or PDF</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    setUploadError(null);
                    setUploadSuccess(null);
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="mt-2 w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-teal-55 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                />
              </label>

              <button
                type="submit"
                disabled={!file || uploadPending}
                className={`rounded-full bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-teal-600 transition-all ${
                  file && !uploadPending ? 'hover:bg-teal-600 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-800'
                }`}
              >
                {uploadPending ? 'Verifying...' : 'Upload & Verify'}
              </button>
            </form>

            {uploadError && (
              <div className="space-y-1.5">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                  ⚠️ {uploadError}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1 leading-relaxed">
                  💡 <strong>Tip:</strong> If your Admit Card is too grainy or blurry, upload a clear photo of your <strong>IGNOU Student ID Card</strong> instead. Status will be verified and you can configure papers manually.
                </p>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-300">
                🎉 {uploadSuccess}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Year Selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white">Profile</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This helps us default your stream, but it no longer restricts which exam papers you can add.
          </p>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">WhatsApp number</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="WhatsApp number (for TEE reminders & study tips)"
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <div className="flex gap-4">
          {[1, 2].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`flex-1 rounded-2xl border p-5 text-center font-bold transition-all ${
                year === y
                  ? 'border-teal-700 bg-teal-50 text-teal-700 ring-1 ring-teal-700 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
              }`}
            >
              Year {y}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-white">Year 2 Stream</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          {MAPC_STREAMS.map((mapcStream) => {
            const s = mapcStream.id;
            return (
            <button
              key={s}
              onClick={() => setStream(s)}
              className={`flex-1 rounded-2xl border p-4 text-center text-sm font-bold transition-all ${
                stream === s
                  ? 'border-teal-700 bg-teal-50 text-teal-700 ring-1 ring-teal-700 dark:bg-teal-900/20'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
              }`}
            >
              {s}
            </button>
            );
          })}
        </div>
      </section>

      {/* Paper Selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold dark:text-white">
            Your Papers
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({selectedPapers.length} selected)
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Select everything you are writing this TEE. Year 1 and Year 2 can live together on the dashboard.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {paperFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setPaperFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                paperFilter === filter
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:border-teal-700 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {visibleCourses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <button
                key={course.code}
                onClick={() => togglePaper(course.code)}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                  selectedPapers.includes(course.code)
                    ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700 dark:bg-teal-900/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800'
                }`}
              >
                <div className={`mb-2 rounded-md px-2 py-0.5 text-xs font-bold ${
                  selectedPapers.includes(course.code)
                    ? 'bg-teal-700 text-white'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {course.code}
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Year {course.year}{course.stream ? ` · ${course.stream}` : ''}
                </div>
                <h3 className="font-bold leading-tight dark:text-white">{course.name}</h3>
                {getExamSchedule(course.code) && (
                  <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Exam: {formatExamDate(getExamSchedule(course.code)!.date)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* URNA Opt-in */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex items-start gap-4">
          <button
            role="switch"
            aria-checked={urnaOptIn}
            disabled={urnaLoading}
            onClick={async () => {
              setUrnaLoading(true);
              const newVal = !urnaOptIn;
              setUrnaOptInState(newVal);
              try {
                await setUrnaOptIn(newVal);
              } catch {
                setUrnaOptInState(!newVal);
              } finally {
                setUrnaLoading(false);
              }
            }}
            className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${urnaOptIn ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${urnaOptIn ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Join the URNA mental health professional and self-help waitlist
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              We&apos;re building a clinical platform to help MAPC graduates find professional roles and access advanced self-help application building blocks.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-teal-700 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
