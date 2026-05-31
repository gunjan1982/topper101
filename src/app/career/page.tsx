import Link from 'next/link';
import type { Metadata } from 'next';
import SubjectSidebar from '../(dashboard)/SubjectSidebar';

export const metadata: Metadata = {
  title: 'Career Paths After IGNOU MAPC — RCI, M.Phil, PsyD, PGDRP Guide',
  description:
    'Complete guide to career pathways after IGNOU MAPC. Covers RCI registration, MA Clinical Psychology (2026 route), M.Phil (last batch 2025), PGDRP, and PsyD options with institutions, fees, and decision guide.',
  openGraph: {
    title: 'What Can You Do After IGNOU MAPC? A Complete RCI Career Pathway Guide',
    description:
      'MAPC gives you the foundation. Here is what comes next — RCI registration options, counselling practice, clinical psychology routes, and the new 2026 landscape.',
  },
};

const PATHWAYS = [
  {
    id: 'rci-registration',
    title: 'RCI Registration — The Licence You Need to Practice',
    emoji: '🪪',
    summary:
      'The Rehabilitation Council of India (RCI) is the statutory body that licenses professionals in clinical and rehabilitation psychology. Without RCI registration, you cannot legally call yourself a "psychologist" or provide paid clinical/counselling services in India.',
    details: [
      'MAPC alone does NOT qualify you for RCI registration. You need a post-MAPC qualification.',
      'RCI-recognized roles include: Clinical Psychologist, Rehabilitation Psychologist, Special Educator, and Rehabilitation Counsellor.',
      'Non-RCI therapists can still practice under terms like "wellness coach", "life coach", or "psychotherapist" — but clinical designation requires registration.',
      'Check your therapist\'s RCI number at rciregistration.nic.in before booking clinical services.',
    ],
    href: 'https://rciregistration.nic.in',
    linkLabel: 'Verify RCI registration',
    tag: 'Required for clinical practice',
    tagColor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  {
    id: 'ma-clinical',
    title: 'MA Clinical Psychology (New Route — Recommended from 2026)',
    emoji: '🎓',
    summary:
      'Several RCI-recognized universities now offer a 2-year MA/MSc in Clinical Psychology that leads directly to RCI registration as a Clinical Psychologist. This route replaced M.Phil as the primary clinical training pathway starting 2026.',
    details: [
      'Duration: 2 years (4 semesters), full-time.',
      'Includes practicum hours at affiliated hospitals and clinics — this is what RCI requires.',
      'RCI recognition: Yes, for registered institutions. Verify the specific institution at rciregistration.nic.in before applying.',
      'Admission: Entrance exam (CUCET, TISS-NET, or institution-specific) + interview.',
      'Recommended institutions: TISS Mumbai, Amity University, Manipal Academy, Christ University Bengaluru, Nimhans (separate competitive exam), AIIMS (limited seats).',
      'Fees: ₹1.5–4 lakh for private universities; government-aided institutions are lower.',
      'This is the recommended route for MAPC graduates from the 2026 batch onward.',
    ],
    tag: 'Recommended (2026+)',
    tagColor: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  },
  {
    id: 'mphil',
    title: 'M.Phil in Clinical Psychology (Last Batch: 2025)',
    emoji: '⏰',
    summary:
      'The M.Phil in Clinical Psychology was the gold standard for RCI registration for decades. It is being phased out — 2025 was the last batch for most institutions. If you are reading this after 2025, this route is likely closed.',
    details: [
      'Duration: 2 years, full-time, highly competitive.',
      'Stipend: ₹15,000–25,000/month at government hospitals (NIMHANS, AIIMS, IHBAS, etc.).',
      'Seats: Extremely limited — 2 to 8 per institution nationally. Pass rate for top institutions: ~1%.',
      'Entry requirement: MA/MSc Psychology + written exam + interview. MAPC is accepted at most institutions.',
      'Why it matters: M.Phil holders are the most sought-after clinical psychologists in India.',
      '2025 was the last batch for most programs. The MA Clinical Psychology (new) replaces it from 2026.',
    ],
    tag: 'Closed after 2025 (most institutions)',
    tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  {
    id: 'pgdrp',
    title: 'PGDRP — Postgraduate Diploma in Rehabilitation Psychology',
    emoji: '🧩',
    summary:
      'A 1-year RCI-recognized diploma that qualifies you as a Rehabilitation Counsellor. Accessible, affordable, and practical for MAPC graduates wanting to work in disability, NGO, or community mental health contexts.',
    details: [
      'Duration: 1 year (some institutions offer 2-year variant).',
      'Eligibility: BA/BSc or MA in Psychology (MAPC qualifies).',
      'RCI recognition: Yes — registers you as a Rehabilitation Counsellor.',
      'Scope of practice: Counselling in rehabilitation settings, special education support, NGO/community health work. NOT for independent clinical practice with severe disorders.',
      'Institutions: NIMHANS, NIEPID Secunderabad, AYJNIHH Mumbai, RCI-affiliated state centres.',
      'Fees: ₹20,000–60,000 (government institutions are lower).',
      'Best for: MAPC graduates who want to start practicing quickly without a 2-year commitment.',
    ],
    tag: 'Quick RCI route (1 year)',
    tagColor: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  {
    id: 'psyd',
    title: 'PsyD — Doctor of Psychology',
    emoji: '🔬',
    summary:
      'A clinical doctorate that produces practice-ready psychologists. Common in the US but now available at select Indian institutions. Highest qualification in the field — suited for those who want to combine research and senior clinical practice.',
    details: [
      'Duration: 3–5 years.',
      'Focus: Applied clinical practice (vs. PhD which focuses on research).',
      'In India: Limited availability. Amity University and a few deemed universities offer PsyD-equivalent programs.',
      'Internationally: US/UK/Australia routes are established but expensive (₹40–80L for US PsyD).',
      'Entry requirement: MA/MSc + relevant work experience (usually 2+ years post-master\'s).',
      'RCI status: RCI recognition for Indian PsyD programs is evolving — verify at rciregistration.nic.in.',
      'Best for: MAPC graduates who want research credentials + clinical depth + long-term career options.',
    ],
    tag: 'Advanced (3–5 years)',
    tagColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
  {
    id: 'counselling-practice',
    title: 'Counselling Practice Without RCI',
    emoji: '💬',
    summary:
      'MAPC plus some supervised practice hours qualifies you to work as a counsellor in schools, corporates, NGOs, and private practice — without RCI registration. The scope is narrower, but the market is large and the barriers are lower.',
    details: [
      'Job titles that don\'t require RCI: School Counsellor, Career Counsellor, Employee Assistance Counsellor, Wellness Coach, Life Coach.',
      'Relevant certification bodies: BACP-India (British Association for Counselling, India affiliate), IACP (Indian Association of Clinical Psychologists — verify status), EMDR India, ICS.',
      'Supervised practice: Most reputable employers expect 100–200 supervised hours. Document yours early.',
      'Private practice: You can set up a counselling practice post-MAPC. Call yourself a "counsellor" or "psychotherapist" — NOT a "clinical psychologist" without RCI.',
      'Earnings: ₹800–3,000 per session (urban private practice). Corporate EAP contracts pay ₹20,000–60,000/month for part-time work.',
      'Growth path: Counsellor → Senior Counsellor → Supervisor → Trainer/Trainer of Trainers.',
    ],
    tag: 'Available immediately post-MAPC',
    tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
];

const DECISION_QUESTIONS = [
  {
    question: 'Do you want to work with severe mental disorders (schizophrenia, BPD, major depression)?',
    answer: 'Yes → Go for MA Clinical Psychology (new route) or PGDRP. Both give RCI registration.',
  },
  {
    question: 'Do you want to work in corporate, schools, or coaching contexts?',
    answer: 'Yes → MAPC alone is sufficient. Consider a counselling certification for credibility (BACP, ICF).',
  },
  {
    question: 'Do you want to research or teach at university level?',
    answer: 'Yes → PhD in Psychology is the direct route. MAPC → PhD via CSIR-NET/UGC-NET.',
  },
  {
    question: 'Do you want to start practicing in the next 12 months?',
    answer: 'Yes → PGDRP (1 year, RCI) or Counsellor Practice (no additional degree). Don\'t wait.',
  },
  {
    question: 'Are you in the Dec-2025 or Jun-2026 final year batch?',
    answer: 'Yes → Apply for MA Clinical Psych admissions immediately. 2026 is the first big cohort for the new pathway.',
  },
];

export default function CareerPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-bold text-teal-700 hover:text-teal-600">
            ← Topper101
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-teal-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-teal-600 transition-all"
          >
            Get Exam Prep →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] flex">
        <SubjectSidebar />
        <main className="flex-1 min-w-0 mx-auto max-w-4xl px-4 py-16 space-y-20">
          {/* Hero */}
        <section className="space-y-6">
          <div className="inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            Career Guide · IGNOU MAPC
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight dark:text-white">
            What Can You Actually Do<br />After IGNOU MAPC?
          </h1>
          <p className="max-w-2xl text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
            MAPC is a rigorous 2-year MA in Psychology. It opens real doors — but the path from degree to
            practice is not obvious. Here is the complete guide to every route, including the new 2026
            clinical pathway that changes everything.
          </p>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Last updated: May 2026 · Written by an IGNOU MAPC graduate (Dec 2025 batch)
          </p>
        </section>

        {/* Quick decision guide */}
        <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-6">
          <h2 className="text-2xl font-bold dark:text-white">Not sure which path fits you?</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Answer these questions:</p>
          <div className="space-y-4">
            {DECISION_QUESTIONS.map((item, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-semibold text-zinc-900 dark:text-white">{item.question}</p>
                <p className="mt-2 text-sm text-teal-700 dark:text-teal-300 font-medium">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pathway cards */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold dark:text-white">Every Pathway, Explained</h2>
          <div className="space-y-6">
            {PATHWAYS.map((pathway) => (
              <article
                key={pathway.id}
                id={pathway.id}
                className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pathway.emoji}</span>
                    <h3 className="text-xl font-bold dark:text-white">{pathway.title}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${pathway.tagColor}`}>
                    {pathway.tag}
                  </span>
                </div>

                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{pathway.summary}</p>

                <ul className="space-y-2">
                  {pathway.details.map((detail, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="mt-0.5 text-teal-600 flex-shrink-0">›</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {pathway.href && (
                  <a
                    href={pathway.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-teal-50 hover:text-teal-700 transition-all dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {pathway.linkLabel} ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* RCI verification CTA */}
        <section className="rounded-3xl bg-teal-700 p-10 text-white space-y-4">
          <h2 className="text-2xl font-bold">Before you book a therapist: verify their RCI number</h2>
          <p className="text-teal-100 leading-relaxed">
            In India, anyone can call themselves a &quot;therapist&quot; or &quot;psychologist&quot; without any license.
            If you are seeking clinical services for a serious concern, check that your provider holds a
            valid RCI registration. It takes 30 seconds.
          </p>
          <a
            href="https://rciregistration.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50 transition-all"
          >
            Check RCI registration ↗
          </a>
        </section>

        {/* Topper101 CTA */}
        <section className="rounded-3xl border border-zinc-200 p-10 text-center dark:border-zinc-800 space-y-4">
          <h2 className="text-2xl font-bold dark:text-white">Preparing for IGNOU MAPC TEE?</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Topper101 maps 10+ years of MAPC past papers, shows which questions repeat most, and gives
            AI-written model answers for every question in all 16 theory courses.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-full bg-teal-700 px-8 py-4 text-base font-bold text-white hover:bg-teal-600 shadow-xl shadow-teal-700/20 transition-all"
          >
            Start for free → topper101.com
          </Link>
          <p className="text-xs text-zinc-400 mt-2">
            Free for 1 subject · No card required
          </p>
        </section>
      </main>
      </div>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-8 text-center text-xs text-zinc-400">
        <p>
          This guide is based on publicly available information from RCI, IGNOU, and university websites.
          Verify all details directly with institutions before applying. Last checked May 2026.
        </p>
        <p className="mt-2">
          <Link href="/" className="hover:text-teal-700">Topper101</Link>
          {' · '}
          <Link href="/signup" className="hover:text-teal-700">Start free</Link>
        </p>
      </footer>
    </div>
  );
}
