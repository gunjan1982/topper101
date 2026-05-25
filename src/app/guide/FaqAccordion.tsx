'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.q}</span>
            <span className="flex-shrink-0 text-zinc-400 text-lg leading-none">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
