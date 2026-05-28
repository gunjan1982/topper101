'use client';

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-black transition-colors duration-300">
      <div className="relative flex flex-col items-center">
        {/* Glow behind the logo */}
        <div className="absolute -inset-4 rounded-full bg-teal-500/20 blur-xl animate-pulse" />

        {/* Logo container with spinning ring */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-teal-700 shadow-2xl shadow-teal-700/30 animate-bounce">
          {/* Outer rotating ring */}
          <div className="absolute -inset-1 rounded-[28px] border-2 border-dashed border-teal-500/40 animate-spin" style={{ animationDuration: '6s' }} />

          {/* Graduation Cap SVG */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md"
          >
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
            <path d="M5 13.18V17l7 4 7-4v-3.82L12 17l-7-3.82z" />
          </svg>
        </div>

        {/* Text details */}
        <h1 className="mt-8 text-2xl font-black tracking-wider text-zinc-900 dark:text-white uppercase">
          Topper<span className="text-teal-600 dark:text-teal-400">101</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide animate-pulse">
          Loading...
        </p>

        {/* Progress bar indicator */}
        <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
            style={{ animation: 'shimmer 1.5s infinite ease-in-out', width: '50%' }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
