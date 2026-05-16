import { updateStream } from '../actions';
import { MAPC_STREAMS } from '@/lib/courseCatalog';

export default function StreamSelectionPage() {
  return (
    <div className="space-y-8 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Choose your specialisation</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Choose your Year 2 stream to see the right papers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {MAPC_STREAMS.map((stream) => (
          <form key={stream.id} action={updateStream.bind(null, stream.id)}>
            <button
              type="submit"
              className="group w-full h-40 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 hover:border-teal-700 hover:ring-1 hover:ring-teal-700 transition-all dark:bg-zinc-900 dark:border-zinc-800"
            >
              <div className="mb-3 text-3xl group-hover:scale-110 transition-transform">{stream.icon}</div>
              <h2 className="text-sm font-bold dark:text-white">{stream.name}</h2>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
