import { signup, signInWithGoogle } from '../actions';
import Link from 'next/link';
import { isGoogleAuthEnabled } from '@/lib/authConfig';
import { safeNextPath, withRedirectTo } from '@/lib/navigation';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string; ref?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const next = safeNextPath(resolvedSearchParams.next);
  const referralCode = resolvedSearchParams.ref?.trim() ?? '';
  const googleAuthEnabled = isGoogleAuthEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Join Topper101 and start studying smarter.
          </p>
        </div>

        <form className="mt-8 space-y-6" action={signup}>
          <input type="hidden" name="redirectTo" value={next} />
          <input type="hidden" name="referral_code" value={referralCode} />
          {referralCode && (
            <div className="rounded-xl bg-teal-50 p-3 text-center text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-100 dark:bg-teal-950/30 dark:text-teal-200 dark:ring-teal-900/50">
              Referral applied. You can unlock an extra paper after onboarding.
            </div>
          )}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-xl border-0 py-3 text-zinc-950 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 sm:text-sm sm:leading-6"
                placeholder="Email address (use Gmail for one-click login later)"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                WhatsApp number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="relative block w-full border-0 py-3 text-zinc-950 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 sm:text-sm sm:leading-6"
                placeholder="WhatsApp number (for TEE reminders & study tips)"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="relative block w-full rounded-b-xl border-0 py-3 text-zinc-950 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          {resolvedSearchParams.error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-200">{resolvedSearchParams.error}</p>
            </div>
          )}

          {resolvedSearchParams.message && (
            <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-900/30">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{resolvedSearchParams.message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-teal-700 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 transition-all active:scale-95"
            >
              Sign up
            </button>
          </div>
        </form>

        {googleAuthEnabled && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-black dark:text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <form action={signInWithGoogle}>
              <input type="hidden" name="redirectTo" value={next} />
              <input type="hidden" name="referral_code" value={referralCode} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-zinc-950 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus-visible:ring-transparent dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 dark:hover:bg-zinc-800 transition-all active:scale-95"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </form>
          </div>
        </div>
        )}

        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            href={withRedirectTo('/login', next)}
            className="font-semibold leading-6 text-teal-700 hover:text-teal-600"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
