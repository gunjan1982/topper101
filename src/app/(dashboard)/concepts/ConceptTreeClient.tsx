'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface ConceptItem {
  id: string;
  name: string;
  definition: string | null;
  key_theorists: string[] | null;
  clinical_relevance: string | null;
  exam_relevance: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  sample_answer_hook: string | null;
  domain: string;
  layer: number;
  mapped_courses?: string[] | null;
}

interface ConceptTreeClientProps {
  initialConcepts: ConceptItem[];
  isPaid: boolean;
}

const FREQ_COLORS: Record<string, string> = {
  HIGH: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-300',
  LOW: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
};

function getLayerColor(layer: number): string {
  const colors = [
    'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-300', // Layer 1
    'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-900/30 dark:text-violet-300', // Layer 2
    'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/30 dark:text-fuchsia-300', // Layer 3
    'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300', // Layer 4
    'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300', // Layer 5
    'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300', // Layer 6
    'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-300', // Layer 7
  ];
  return colors[(layer - 1) % colors.length];
}

export default function ConceptTreeClient({ initialConcepts, isPaid }: ConceptTreeClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedLayer, setSelectedLayer] = useState<string>('All');
  const [selectedFreq, setSelectedFreq] = useState<string>('All');

  // Extract all unique domains
  const domains = useMemo(() => {
    const set = new Set<string>();
    initialConcepts.forEach((c) => {
      if (c.domain) set.add(c.domain);
    });
    return Array.from(set).sort();
  }, [initialConcepts]);

  // Compute counts per domain
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialConcepts.forEach((c) => {
      if (c.domain) {
        counts[c.domain] = (counts[c.domain] || 0) + 1;
      }
    });
    return counts;
  }, [initialConcepts]);

  // Filtered concepts
  const filteredConcepts = useMemo(() => {
    return initialConcepts.filter((concept) => {
      const matchesSearch =
        searchTerm === '' ||
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (concept.definition && concept.definition.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDomain = selectedDomain === 'All' || concept.domain === selectedDomain;
      const matchesLayer = selectedLayer === 'All' || String(concept.layer) === selectedLayer;
      const matchesFreq = selectedFreq === 'All' || concept.exam_relevance === selectedFreq;

      return matchesSearch && matchesDomain && matchesLayer && matchesFreq;
    });
  }, [initialConcepts, searchTerm, selectedDomain, selectedLayer, selectedFreq]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
            <span>🧠</span> Concept Tree
          </h1>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
            Browse and search psychology concepts across core layers and domains.
          </p>
        </div>
        {!isPaid && (
          <Link
            href={ROUTES.pricing}
            className="w-fit rounded-full bg-gradient-to-r from-teal-700 to-indigo-600 px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-teal-700/10 hover:shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Upgrade to unlock all theorists & clinical relevance
          </Link>
        )}
      </div>

      {/* Free Tier Lock Alert Banner */}
      {!isPaid && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-950/15">
          <div className="flex gap-4">
            <span className="text-2xl">🔒</span>
            <div className="space-y-1.5">
              <h3 className="font-bold text-amber-800 dark:text-amber-300">Free Tier Preview Mode</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Key theorists list and clinical relevance details are locked. Upgrade to Topper101 Pass or Pro to unlock comprehensive concept data, repeating question families, and detailed AI answers.
              </p>
              <div className="pt-2">
                <Link
                  href={ROUTES.pricing}
                  className="text-sm font-bold text-teal-700 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  View Plans & Pricing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls: Search and Quick Filters */}
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-1 md:grid-cols-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search concepts or definitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-700 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-teal-700 dark:focus:bg-black transition-colors"
          />
        </div>

        {/* Layer Filter */}
        <div>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-teal-700 dark:focus:bg-black transition-colors"
          >
            <option value="All">All Layers</option>
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={String(l)}>
                Layer {l}
              </option>
            ))}
          </select>
        </div>

        {/* Frequency Filter */}
        <div>
          <select
            value={selectedFreq}
            onChange={(e) => setSelectedFreq(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-teal-700 dark:focus:bg-black transition-colors"
          >
            <option value="All">All Frequencies</option>
            <option value="HIGH">HIGH Frequency</option>
            <option value="MEDIUM">MEDIUM Frequency</option>
            <option value="LOW">LOW Frequency</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Desktop Sidebar / Mobile Horizontal Tabs for Domains */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 hidden lg:block">
            Filter by Domain
          </div>
          {/* Mobile Domain Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 pr-2 scrollbar-none lg:hidden">
            <button
              onClick={() => setSelectedDomain('All')}
              className={`flex-none rounded-full px-4 py-2 text-xs font-bold transition-all ${
                selectedDomain === 'All'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/10'
                  : 'border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              All Domains ({initialConcepts.length})
            </button>
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`flex-none rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedDomain === domain
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/10'
                    : 'border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                {domain} ({domainCounts[domain] || 0})
              </button>
            ))}
          </div>

          {/* Desktop Domain List */}
          <div className="hidden flex-col gap-1.5 lg:flex">
            <button
              onClick={() => setSelectedDomain('All')}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                selectedDomain === 'All'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All Domains</span>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {initialConcepts.length}
                </span>
              </div>
            </button>
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                  selectedDomain === domain
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{domain}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {domainCounts[domain] || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Concept Cards List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <h2 className="text-xl font-bold dark:text-white">
              {selectedDomain === 'All' ? 'All Concepts' : selectedDomain}
            </h2>
            <span className="text-sm font-medium text-zinc-500">
              Showing {filteredConcepts.length} of {initialConcepts.length}
            </span>
          </div>

          {filteredConcepts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <span className="text-4xl">🔍</span>
              <p className="mt-4 font-bold text-zinc-700 dark:text-zinc-300">No concepts found</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Try clearing your search query or adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="group/card relative space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:shadow-none transition-all duration-300"
                >
                  {/* Top Badge Panel */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white transition-colors group-hover/card:text-teal-700 dark:group-hover/card:text-teal-400">
                          {concept.name}
                        </h3>
                        {concept.mapped_courses && concept.mapped_courses.map((course) => (
                          <span
                            key={course}
                            className="rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[10px] font-black text-teal-700 dark:bg-teal-950/40 dark:border-teal-900/30 dark:text-teal-300"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {concept.domain}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getLayerColor(concept.layer)}`}>
                        Layer {concept.layer}
                      </span>
                      {concept.exam_relevance && (
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${FREQ_COLORS[concept.exam_relevance] ?? FREQ_COLORS.LOW}`}>
                          {concept.exam_relevance} Frequency
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Definition */}
                  {concept.definition && (
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {concept.definition}
                    </p>
                  )}

                  {/* Answer Hook */}
                  {concept.sample_answer_hook && (
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/20 p-4 transition-colors group-hover/card:border-violet-200 dark:border-violet-900/20 dark:bg-violet-950/5 dark:group-hover/card:border-violet-800/40">
                      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        Answer hook / Essay structure
                      </div>
                      <p className="text-sm italic text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        &ldquo;{concept.sample_answer_hook}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Theorists & Clinical Relevance Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    {/* Key Theorists */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        Key Theorists
                      </span>
                      {concept.key_theorists && concept.key_theorists.length > 0 && isPaid ? (
                        <div className="flex flex-wrap gap-1.5">
                          {concept.key_theorists.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : concept.key_theorists && concept.key_theorists.length > 0 ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 bg-zinc-50/50 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
                          <span>🔒 Theorists list</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">· Upgrade to unlock</span>
                        </div>
                      ) : (
                        <p className="text-xs italic text-zinc-400">None specified</p>
                      )}
                    </div>

                    {/* Clinical Relevance */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        Clinical Relevance
                      </span>
                      {concept.clinical_relevance && isPaid ? (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {concept.clinical_relevance}
                        </p>
                      ) : concept.clinical_relevance ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 bg-zinc-50/50 px-3 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-400">
                          <span>🔒 Clinical relevance</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">· Upgrade to unlock</span>
                        </div>
                      ) : (
                        <p className="text-xs italic text-zinc-400">None specified</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
