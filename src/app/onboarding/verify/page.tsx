'use client';

import { useState, useTransition, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyStudentDocument } from '../actions';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

type VerificationSuccessState = {
  document_type: 'admit_card' | 'id_card';
  student_name?: string | null;
  enrollment_number?: string | null;
  papers?: string[];
  year?: number;
  stream?: string | null;
  redirect_to?: string;
};

function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = searchParams.get('required') === 'true';

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<VerificationSuccessState | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file format. Only PDF, PNG, JPG, and JPEG are supported.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const res = await verifyStudentDocument(formData);
      if (res.status === 'error') {
        setError(res.message || 'Verification failed');
      } else {
        setSuccess({
          document_type: res.document_type as 'admit_card' | 'id_card',
          student_name: res.student_name,
          enrollment_number: res.enrollment_number,
          papers: res.papers,
          year: res.year,
          stream: res.stream,
          redirect_to: res.redirect_to
        });
      }
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Unlock Your First Subject Free</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm">
          Upload your IGNOU Admit Card to auto-configure and start studying instantly — or use your Student ID Card.
        </p>
        <div className="mt-2.5">
          <a
            href="/sample-admit-card.png"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-teal-700 hover:text-teal-600 underline inline-flex items-center gap-1"
          >
            🔍 View Sample Admit Card
          </a>
        </div>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Value prop box */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 text-left dark:border-teal-900/40 dark:from-teal-950/20 dark:to-emerald-950/20">
            <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
              🎁 Upload once → Study free forever
            </p>
            <p className="mt-1 text-xs text-teal-700/80 dark:text-teal-400/80 leading-relaxed">
              Your first subject is completely free — all past questions, curated answers, textbook references, and exam predictions. Just verify you&apos;re an IGNOU MAPC student.
            </p>
          </div>

          {required && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/30 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                🔒 Student verification is required to claim your free subject and access your dashboard.
              </p>
            </div>
          )}

          {/* Info cards explaining verification documents */}
          <div className="grid gap-4 sm:grid-cols-2 text-left">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">📅</span>
                <h3 className="font-bold text-sm dark:text-white">Admit Card (TEE)</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                Recommended. Auto-detects all your exam papers, year of study, and specialisation. Setup takes 1-click.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">🆔</span>
                <h3 className="font-bold text-sm dark:text-white">Student ID Card</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                Verifies enrollment status instantly. Requires manual selection of papers in the next steps.
              </p>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
              dragActive
                ? 'border-teal-700 bg-teal-50/20 dark:bg-teal-950/10'
                : 'border-zinc-300 bg-white hover:border-teal-700/50 dark:border-zinc-800 dark:bg-zinc-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            {file ? (
              <div className="space-y-3">
                <div className="text-4xl">📄</div>
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 max-w-xs truncate mx-auto">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="rounded-full bg-zinc-100 hover:bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl text-zinc-400">📤</div>
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Drag & drop your file here
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    or click to browse from device (PDF, PNG, JPG, JPEG up to 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="space-y-2 text-left">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 px-2 leading-relaxed">
                💡 <strong>Tip:</strong> If your Admit Card is too grainy or cannot be parsed, try uploading a clear photo of your <strong>IGNOU Student ID Card</strong> instead. This will verify your student status and allow you to configure your subjects manually.
              </p>
            </div>
          )}

          {isPending ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <svg className="animate-spin h-8 w-8 text-teal-700 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-400 animate-pulse">
                Analyzing document... Gemini AI is matching your psychology subjects...
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!file}
              className={`w-full rounded-full bg-teal-700 py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all ${
                file
                  ? 'hover:bg-teal-600 active:scale-[0.99]'
                  : 'opacity-50 cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-800'
              }`}
            >
              Verify Document
            </button>
          )}

          {!required && (
            <div className="pt-6 text-center">
              <Link
                href={ROUTES.onboardingYear}
                className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
              >
                I&apos;ll do this later in Settings (subjects remain locked)
              </Link>
            </div>
          )}
        </form>
      ) : (
        /* Success Screen */
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center space-y-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
              Student verified successfully!
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Welcome aboard, <span className="font-bold text-zinc-800 dark:text-zinc-200">{success.student_name}</span>.
            </p>
            {success.enrollment_number && (
              <p className="text-xs text-zinc-400 mt-1">
                Enrollment No: <span className="font-medium text-zinc-600 dark:text-zinc-300">{success.enrollment_number}</span>
              </p>
            )}
          </div>

          {success.document_type === 'admit_card' ? (
            <div className="rounded-2xl bg-zinc-50 p-5 text-left border border-zinc-100 dark:bg-zinc-950/30 dark:border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
                <span>Auto-Configured Papers</span>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-teal-700 dark:bg-teal-900/20">
                  Year {success.year} {success.stream ? `· ${success.stream}` : ''}
                </span>
              </div>
              <ul className="grid gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {success.papers?.map((code) => (
                  <li key={code} className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span> {code}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-50 p-5 text-center border border-zinc-100 dark:bg-zinc-950/30 dark:border-zinc-800/80">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Student ID card verified. Let&apos;s configure your Year and Stream to select papers.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              router.push(success.redirect_to || (success.document_type === 'admit_card' ? ROUTES.onboardingFreeSubject : ROUTES.onboardingYear));
            }}
            className="w-full rounded-full bg-teal-700 py-3.5 text-center text-sm font-bold text-white shadow-lg hover:bg-teal-600 active:scale-[0.99] transition-all"
          >
            {success.document_type === 'admit_card' || success.redirect_to === ROUTES.onboardingFreeSubject
              ? 'Choose Free Subject to Unlock →'
              : 'Configure My Papers →'}
          </button>
          
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto mt-2 leading-relaxed">
            💡 <strong>Tip:</strong> If you signed up with a Gmail address, you can log in directly using Google next time for passwordless, one-click access.
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px]">
        <svg className="animate-spin h-8 w-8 text-teal-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    }>
      <VerificationForm />
    </Suspense>
  );
}
