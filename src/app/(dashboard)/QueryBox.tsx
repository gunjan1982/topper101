'use client';

import { useState } from 'react';
import { submitQueryBox } from '../actions/support';

interface QueryBoxProps {
  isLoggedIn: boolean;
}

export default function QueryBox({ isLoggedIn }: QueryBoxProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('message', message);
    formData.append('category', category);
    if (!isLoggedIn) {
      formData.append('email', email);
    }

    try {
      const res = await submitQueryBox(formData);
      if (res.error) {
        setStatus('error');
        setErrorMsg(res.error);
      } else {
        setStatus('success');
        setMessage('');
        setEmail('');
        // Reset success state after 4 seconds
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 text-center">
        <span className="text-xl">🎉</span>
        <p className="mt-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          Request Sent!
        </p>
        <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
          We have received your query and will respond shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-150 bg-zinc-50/50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-900/20">
      <div>
        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <span>💬</span> Got a Request / Query?
        </h4>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          Ask for a course, assignment, report issues, or suggest features.
        </p>
      </div>

      <div className="space-y-2">
        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 transition-colors"
        >
          <option value="other">General Query</option>
          <option value="feature">Request Course / Program</option>
          <option value="content">Request Assignment Answer</option>
          <option value="access">Access / Payment Issue</option>
        </select>

        {/* Email for Guest Users */}
        {!isLoggedIn && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Your email address"
            className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-850 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 transition-colors"
          />
        )}

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          placeholder="Type your message here..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-850 focus:border-teal-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 transition-colors resize-none"
        />
      </div>

      {errorMsg && (
        <p className="text-[10px] font-semibold text-red-500">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || !message.trim()}
        className="w-full rounded-xl bg-zinc-900 py-2 text-[11px] font-bold text-white transition-all hover:bg-zinc-850 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5"
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Sending...</span>
          </>
        ) : (
          <span>Submit Request</span>
        )}
      </button>
    </form>
  );
}
