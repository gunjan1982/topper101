'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { unlockConceptTree } from './actions';

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
  initialUrnaOptIn?: boolean;
  userEmail?: string | null;
  selectedPapers?: string[];
  unlockedSubjects?: string[];
  unlockedConceptTrees?: string[];
  userCredits?: number;
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

export default function ConceptTreeClient({
  initialConcepts,
  isPaid,
  userEmail = null,
  selectedPapers = [],
  unlockedSubjects = [],
  unlockedConceptTrees = [],
  userCredits = 0,
}: ConceptTreeClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedLayer, setSelectedLayer] = useState<string>('All');
  const [selectedFreq, setSelectedFreq] = useState<string>('All');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Credit/Unlock State
  const [credits, setCredits] = useState(userCredits);
  const [conceptTreeUnlocks, setConceptTreeUnlocks] = useState<string[]>(unlockedConceptTrees);
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Synchronize dynamic state on load or prop change
  useEffect(() => {
    setCredits(userCredits);
    setConceptTreeUnlocks(unlockedConceptTrees);
  }, [userCredits, unlockedConceptTrees]);

  // Unique course/subject codes from concepts
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    initialConcepts.forEach((c) => {
      if (c.mapped_courses && c.mapped_courses.length > 0) {
        c.mapped_courses.forEach((course) => set.add(course));
      } else {
        set.add('General Psychology');
      }
    });
    return Array.from(set).sort();
  }, [initialConcepts]);

  // Concept counts per subject
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialConcepts.forEach((c) => {
      if (c.mapped_courses && c.mapped_courses.length > 0) {
        c.mapped_courses.forEach((course) => {
          counts[course] = (counts[course] || 0) + 1;
        });
      } else {
        counts['General Psychology'] = (counts['General Psychology'] || 0) + 1;
      }
    });
    return counts;
  }, [initialConcepts]);

  // Sort subjects so that user's enrolled papers appear first
  const sortedSubjects = useMemo(() => {
    const enrolledSet = new Set(selectedPapers);
    return [...allSubjects].sort((a, b) => {
      const aEnrolled = enrolledSet.has(a);
      const bEnrolled = enrolledSet.has(b);
      if (aEnrolled && !bEnrolled) return -1;
      if (!aEnrolled && bEnrolled) return 1;
      return a.localeCompare(b);
    });
  }, [allSubjects, selectedPapers]);

  // Filter concepts based on search, layer, frequency
  const filteredConcepts = useMemo(() => {
    return initialConcepts.filter((concept) => {
      const matchesSearch =
        searchTerm === '' ||
        concept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (concept.definition && concept.definition.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLayer = selectedLayer === 'All' || String(concept.layer) === selectedLayer;
      const matchesFreq = selectedFreq === 'All' || concept.exam_relevance === selectedFreq;

      return matchesSearch && matchesLayer && matchesFreq;
    });
  }, [initialConcepts, searchTerm, selectedLayer, selectedFreq]);

  // Group filtered concepts by Subject
  const conceptsBySubject = useMemo(() => {
    const groups: Record<string, ConceptItem[]> = {};
    filteredConcepts.forEach((concept) => {
      if (concept.mapped_courses && concept.mapped_courses.length > 0) {
        concept.mapped_courses.forEach((course) => {
          if (!groups[course]) groups[course] = [];
          if (!groups[course].some(c => c.id === concept.id)) {
            groups[course].push(concept);
          }
        });
      } else {
        const course = 'General Psychology';
        if (!groups[course]) groups[course] = [];
        if (!groups[course].some(c => c.id === concept.id)) {
          groups[course].push(concept);
        }
      }
    });

    // Sort concepts within each branch by layer
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.layer - b.layer || a.name.localeCompare(b.name));
    });

    if (selectedSubject !== 'All') {
      const singleGroup: Record<string, ConceptItem[]> = {};
      if (groups[selectedSubject]) {
        singleGroup[selectedSubject] = groups[selectedSubject];
      }
      return singleGroup;
    }

    return groups;
  }, [filteredConcepts, selectedSubject]);

  const activeSubjects = useMemo(() => {
    return Object.keys(conceptsBySubject).sort();
  }, [conceptsBySubject]);

  // Entitlement unlock check
  const isSubjectUnlocked = (courseCode: string) => {
    if (isPaid) return true;
    if (courseCode === 'General Psychology') return true;

    // First subject in enrolled papers is complimentary
    if (selectedPapers.length > 0 && courseCode === selectedPapers[0]) {
      return true;
    }

    // Already unlocked for full Q-Bank access
    if (unlockedSubjects.includes(courseCode)) {
      return true;
    }

    // Concept tree branch specifically unlocked
    if (conceptTreeUnlocks.includes(courseCode)) {
      return true;
    }

    return false;
  };

  const handleUnlockSubjectTree = async (courseCode: string) => {
    setUnlockLoading(courseCode);
    setUnlockError(null);
    try {
      const res = await unlockConceptTree(courseCode);
      if (res?.success) {
        setCredits(prev => Math.max(0, prev - 1));
        setConceptTreeUnlocks(prev => [...prev, courseCode]);
        setExpandedSubjects(prev => ({ ...prev, [courseCode]: true }));
      }
    } catch (err: unknown) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock subject concept tree.');
    } finally {
      setUnlockLoading(null);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val !== '') {
      const next: Record<string, boolean> = {};
      allSubjects.forEach((s) => {
        next[s] = true;
      });
      setExpandedSubjects(next);
    }
  };

  const handleLayerChange = (val: string) => {
    setSelectedLayer(val);
    if (val !== 'All') {
      const next: Record<string, boolean> = {};
      allSubjects.forEach((s) => {
        next[s] = true;
      });
      setExpandedSubjects(next);
    }
  };

  const handleFreqChange = (val: string) => {
    setSelectedFreq(val);
    if (val !== 'All') {
      const next: Record<string, boolean> = {};
      allSubjects.forEach((s) => {
        next[s] = true;
      });
      setExpandedSubjects(next);
    }
  };

  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    if (val !== 'All') {
      setExpandedSubjects((prev) => ({ ...prev, [val]: true }));
    }
  };

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subject]: !prev[subject] }));
  };

  const handleExpandAllSubjects = () => {
    const next: Record<string, boolean> = {};
    allSubjects.forEach((s) => {
      next[s] = true;
    });
    setExpandedSubjects(next);
  };

  const handleCollapseAllSubjects = () => {
    const next: Record<string, boolean> = {};
    allSubjects.forEach((s) => {
      next[s] = false;
    });
    setExpandedSubjects(next);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
            <span>🧠</span> Concept Tree
          </h1>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
            Browse and search psychology concepts across core layers and subjects.
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

      {/* Pricing / Unlock Information Banner */}
      {!isPaid && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/30 dark:bg-amber-950/15">
          <div className="flex gap-4">
            <span className="text-2xl">🔒</span>
            <div className="space-y-1.5">
              <h3 className="font-bold text-amber-800 dark:text-amber-300">Free Tier Previews & Concept Rules</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your first subject concept tree branch is **complimentary**. Any subject unlocked for full question-bank prep is also free.
                Subsequent locked subject concept trees can be unlocked individually for **1 Topper Credit**.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  Your Balance: 🪙 {credits} Credit{credits !== 1 ? 's' : ''}
                </span>
                <Link
                  href={ROUTES.pricing}
                  className="text-xs font-bold text-teal-700 hover:text-teal-650 dark:text-teal-400 dark:hover:text-teal-350 underline"
                >
                  Buy Credits Pack →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-1 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search concepts or definitions..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-teal-700 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-teal-700 dark:focus:bg-black transition-colors"
          />
        </div>

        <div>
          <select
            value={selectedLayer}
            onChange={(e) => handleLayerChange(e.target.value)}
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

        <div>
          <select
            value={selectedFreq}
            onChange={(e) => handleFreqChange(e.target.value)}
            className="w-full rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:focus:border-teal-700 dark:focus:bg-black transition-colors"
          >
            <option value="All">All Frequencies</option>
            <option value="HIGH">HIGH Frequency</option>
            <option value="MEDIUM">MEDIUM Frequency</option>
            <option value="LOW">LOW Frequency</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Left filter column: Subject list */}
        <div className="space-y-3 hidden lg:block">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Filter by Subject
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleSubjectChange('All')}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                selectedSubject === 'All'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All Subjects</span>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {initialConcepts.length}
                </span>
              </div>
            </button>
            {sortedSubjects.map((subj) => (
              <button
                key={subj}
                onClick={() => handleSubjectChange(subj)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${
                  selectedSubject === subj
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-300'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{subj}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {subjectCounts[subj] || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right branch details */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <h2 className="text-xl font-bold dark:text-white">
              {selectedSubject === 'All' ? 'Concept Branches' : selectedSubject}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-500">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExpandAllSubjects}
                  className="text-xs text-teal-700 hover:underline dark:text-teal-400 font-bold"
                >
                  Expand All Subjects
                </button>
                <span>·</span>
                <button
                  onClick={handleCollapseAllSubjects}
                  className="text-xs text-teal-700 hover:underline dark:text-teal-400 font-bold"
                >
                  Collapse All Subjects
                </button>
              </div>
              <span>Showing {filteredConcepts.length} of {initialConcepts.length}</span>
            </div>
          </div>

          {/* URNA Waitlist Promo */}
          <div className="relative overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-indigo-50/30 to-purple-50/50 p-6 dark:border-teal-900/30 dark:from-teal-950/10 dark:via-indigo-950/5 dark:to-purple-950/10 shadow-sm">
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-teal-100 dark:bg-teal-900/40 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                    URNA Clinical Platform
                  </span>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Bridging Academic Theory with Real-World Clinical Practice
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  We are building <strong>URNA</strong>, a next-generation ecosystem connecting psychological concepts directly to practice.
                </p>
              </div>
            </div>
          </div>

          {unlockError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-xs font-bold text-red-800 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-300">
              ⚠️ Error: {unlockError}
            </div>
          )}

          {activeSubjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <span className="text-4xl">🔍</span>
              <p className="mt-4 font-bold text-zinc-700 dark:text-zinc-300">No concepts found</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-teal-500/25 ml-4 sm:ml-6 mt-6 space-y-6">
              {/* Central Root Node representing the Tree Anchor */}
              <div className="relative -ml-[41px] sm:-ml-[49px] mb-8 flex items-center gap-3 select-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-teal-700 to-indigo-600 text-white shadow-md font-black text-xl border-4 border-zinc-50 dark:border-zinc-950 ring-4 ring-teal-500/10">
                  🌳
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
                  <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 block mb-0.5">
                    Concept Tree Anchor
                  </span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-150">
                    Topper101 Psychology Core Map
                  </span>
                </div>
              </div>

              {activeSubjects.map((subject) => {
                const subjectConcepts = conceptsBySubject[subject] || [];
                const isExpanded = !!expandedSubjects[subject];
                const isUnlocked = isSubjectUnlocked(subject);

                return (
                  <div key={subject} className="relative">
                    {/* Visual Connector Tick from main tree trunk */}
                    <div className="absolute -left-[24px] sm:-left-[32px] top-8 w-[24px] sm:w-[32px] border-t-2 border-dashed border-teal-500/25" />

                    <div
                      className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/10 shadow-sm relative z-10 hover:shadow-md transition-all"
                    >
                      <button
                        onClick={() => toggleSubject(subject)}
                        className="w-full flex items-center justify-between p-5 font-bold text-left border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">📁</span>
                          <span className="text-zinc-900 dark:text-white text-base md:text-lg">
                            {subject} {selectedPapers[0] === subject && !isPaid && '(Complimentary)'}
                          </span>
                          <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {subjectConcepts.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isUnlocked && (
                            <span className="text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 font-bold dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 flex items-center gap-1">
                              <span>🔒</span> Locked
                            </span>
                          )}
                          <svg
                            className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-teal-700' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-5 bg-zinc-50/30 dark:bg-zinc-950/10 border-t border-zinc-100 dark:border-zinc-800">
                          {isUnlocked ? (
                            <div className="relative pl-6 border-l border-violet-200 dark:border-violet-900/50 space-y-4 ml-2 mt-1">
                              {subjectConcepts.map((concept) => (
                                <div key={concept.id} className="relative">
                                  {/* Visual Connector from Subject Trunk to Concept Leaf */}
                                  <div className="absolute -left-[25px] top-1/2 -translate-y-1/2 w-6 border-t border-violet-200 dark:border-violet-900/50" />
                                  <ConceptTreeCard
                                    concept={concept}
                                    isPaid={isPaid}
                                    userEmail={userEmail}
                                    currentSubject={subject}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-6 text-center space-y-4">
                              <span className="text-4xl block">🔒</span>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Subject Concept Tree Locked</h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                  Access to the concept branches for {subject} is locked. Spend 1 credit to unlock it permanently.
                                </p>
                              </div>
                              <div className="inline-flex flex-col items-center gap-2 pt-2">
                                {credits >= 1 ? (
                                  <button
                                    onClick={() => handleUnlockSubjectTree(subject)}
                                    disabled={unlockLoading === subject}
                                    className="rounded-full bg-teal-700 hover:bg-teal-650 text-white px-5 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                  >
                                    {unlockLoading === subject ? 'Unlocking...' : 'Spend 1 Credit to Unlock'}
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <span className="text-[11px] font-semibold text-amber-600 block">
                                      ⚠️ You need 1 credit to unlock this subject tree.
                                    </span>
                                    <Link
                                      href={ROUTES.pricing}
                                      className="inline-block rounded-full bg-teal-700 hover:bg-teal-650 text-white px-5 py-2 text-xs font-bold transition-all active:scale-95"
                                    >
                                      Buy Credits Pack (₹49)
                                    </Link>
                                  </div>
                                )}
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                                  Your balance: 🪙 {credits} credit{credits !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConceptTreeCard({
  concept,
  isPaid,
  userEmail,
  currentSubject,
}: {
  concept: ConceptItem;
  isPaid: boolean;
  userEmail: string | null;
  currentSubject?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isLocked = !isPaid && concept.layer >= 3;
  const isActive = isHovered || isFocused;

  return (
    <div
      tabIndex={isLocked ? -1 : 0}
      onFocus={() => {
        if (!isLocked) setIsFocused(true);
      }}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => {
        if (!isLocked) setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      className={`group/card relative rounded-2xl border transition-all duration-300 bg-white dark:bg-zinc-900/30 overflow-hidden outline-none ${
        isLocked
          ? 'border-zinc-200 opacity-60 grayscale dark:border-zinc-800'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-400/80 dark:hover:border-violet-800/80 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500'
      }`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer select-none"
        onClick={() => {
          if (!isLocked) setIsExpanded(!isExpanded);
        }}
      >
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white truncate group-hover/card:text-violet-700 dark:group-hover/card:text-violet-400 transition-colors">
              {concept.name}
            </h4>
            {concept.mapped_courses && concept.mapped_courses.map((course) => (
              <span
                key={course}
                className="rounded-md bg-teal-50 border border-teal-100 px-2 py-0.5 text-[9px] font-black text-teal-700 dark:bg-teal-950/40 dark:border-teal-900/30 dark:text-teal-300"
              >
                {course}
              </span>
            ))}
            {concept.mapped_courses && concept.mapped_courses.length > 1 && currentSubject && (
              <span
                className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/30 dark:text-indigo-300 flex items-center gap-1 cursor-help"
                title={`This concept is distributed across: ${concept.mapped_courses.join(', ')}`}
              >
                <span>🌐</span> Shared Node (also in {concept.mapped_courses.filter(c => c !== currentSubject).join(', ')})
              </span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getLayerColor(concept.layer)}`}>
              Layer {concept.layer}
            </span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {concept.domain}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {concept.exam_relevance && (
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${FREQ_COLORS[concept.exam_relevance] ?? FREQ_COLORS.LOW}`}>
              {concept.exam_relevance} TEE
            </span>
          )}
          {!isLocked ? (
            <svg
              className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-violet-500' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <span className="text-sm">🔒</span>
          )}
        </div>
      </div>

      {isExpanded && !isLocked && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-4 relative bg-zinc-50/50 dark:bg-zinc-950/20">
          {isActive ? (
            <>
              {userEmail && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.03] select-none z-0">
                  <span className="text-[11px] font-bold tracking-wider text-zinc-950 dark:text-white uppercase select-none" style={{ transform: 'rotate(-15deg)' }}>
                    {userEmail} · topper101.com
                  </span>
                </div>
              )}

              <div className="relative z-10 space-y-3.5">
                {concept.definition && (
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Definition</h5>
                    <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 select-none">
                      {concept.definition}
                    </p>
                  </div>
                )}

                {concept.sample_answer_hook && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/20 p-3 dark:border-violet-950/40 dark:bg-violet-950/10">
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                      Answer hook / Essay structure
                    </div>
                    <p className="text-xs italic text-zinc-700 dark:text-zinc-300 leading-relaxed select-none">
                      &ldquo;{concept.sample_answer_hook}&rdquo;
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Key Theories / Theorists</h5>
                    {concept.key_theorists && concept.key_theorists.length > 0 && isPaid ? (
                      <div className="flex flex-wrap gap-1">
                        {concept.key_theorists.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : concept.key_theorists && concept.key_theorists.length > 0 ? (
                      <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <span>🔒 Gated</span>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-zinc-400">None specified</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Clinical Relevance</h5>
                    {concept.clinical_relevance && isPaid ? (
                      <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {concept.clinical_relevance}
                      </p>
                    ) : concept.clinical_relevance ? (
                      <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <span>🔒 Gated</span>
                      </div>
                    ) : (
                      <p className="text-[11px] italic text-zinc-400">None specified</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                ✨ Hover or focus to reveal details
              </p>
            </div>
          )}
        </div>
      )}

      {isLocked && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-100/50 dark:bg-zinc-950/40 text-center space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            🔒 Layer 3+ concept locked on Free Tier.
          </p>
          <Link
            href={ROUTES.pricing}
            className="inline-block text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            Upgrade to view →
          </Link>
        </div>
      )}
    </div>
  );
}
