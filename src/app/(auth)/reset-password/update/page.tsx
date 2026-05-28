'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updatePassword } from '../../actions';

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSettingSession, setIsSettingSession] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check query params for error
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }

    async function handleHashParams() {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token=')) {
        return;
      }

      setIsSettingSession(true);
      try {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const supabase = createClient();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
          } else {
            setMessage('Session established! You can now update your password.');
            // Clean up the hash from the URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse session tokens');
      } finally {
        setIsSettingSession(false);
      }
    }

    handleHashParams();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Set your new password
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Please enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={updatePassword}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="new-password" className="sr-only">
                New Password
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                disabled={isSettingSession}
                className="relative block w-full rounded-xl border-0 py-3 text-zinc-950 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 sm:text-sm sm:leading-6 disabled:opacity-50"
                placeholder="New Password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-900/30">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSettingSession}
              className="flex w-full justify-center rounded-xl bg-teal-700 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSettingSession ? 'Verifying session...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
