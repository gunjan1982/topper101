import Link from 'next/link';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" action="/api/auth/reset-password" method="POST">
          <div className="rounded-md shadow-sm">
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
                className="relative block w-full rounded-xl border-0 py-3 text-zinc-950 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
          </div>

          {searchParams.error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-200">{searchParams.error}</p>
            </div>
          )}

          {searchParams.message && (
            <div className="rounded-md bg-emerald-50 p-4 dark:bg-emerald-900/30">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">{searchParams.message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-xl bg-teal-700 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-600 transition-all active:scale-95"
            >
              Send reset link
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Remembered your password?{' '}
          <Link
            href="/login"
            className="font-semibold leading-6 text-teal-700 hover:text-teal-600"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
