import { updateYear } from '../actions';

export default function YearSelectionPage() {
  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Which year are you in?</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Select your current year of study in IGNOU MAPC.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <form action={updateYear.bind(null, 1)}>
          <button
            type="submit"
            className="group w-full h-48 flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 hover:border-teal-700 hover:ring-1 hover:ring-teal-700 transition-all dark:bg-zinc-900 dark:border-zinc-800"
          >
            <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">📚</div>
            <h2 className="text-xl font-bold dark:text-white">Year 1</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Core Papers (MPC-001 to 006)</p>
          </button>
        </form>

        <form action={updateYear.bind(null, 2)}>
          <button
            type="submit"
            className="group w-full h-48 flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 hover:border-teal-700 hover:ring-1 hover:ring-teal-700 transition-all dark:bg-zinc-900 dark:border-zinc-800"
          >
            <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">🎯</div>
            <h2 className="text-xl font-bold dark:text-white">Year 2</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Specialisation Papers</p>
          </button>
        </form>
      </div>
    </div>
  );
}
