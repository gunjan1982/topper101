import Link from 'next/link';
import Logo from '../Logo';
import FaqAccordion from './FaqAccordion';
import { COURSE_CATALOG, MAPC_STREAMS } from '@/lib/courseCatalog';
import { withRedirectTo } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';
import type { Metadata } from 'next';
import SubjectSidebar from '../(dashboard)/SubjectSidebar';

export const metadata: Metadata = {
  title: 'IGNOU MAPC Complete Study Guide 2025–26 — Topper101',
  description:
    'Everything IGNOU MAPC students need: program structure, TEE exam format, specialisation streams, assignment tips, practicum guide and common FAQs — all in one place, free.',
};

const signupHref = withRedirectTo(ROUTES.signup, ROUTES.dashboard);

const year1Courses = COURSE_CATALOG.filter((c) => c.year === 1 && c.course_type === 'theory');

const streamCourses = MAPC_STREAMS.map((stream) => ({
  ...stream,
  courses: COURSE_CATALOG.filter(
    (c) => c.year === 2 && c.course_type === 'theory' &&
    (c.stream === stream.id || c.stream === 'Common')
  ),
}));

const FAQ_ITEMS = [
  {
    q: 'Do I need to submit assignments before appearing for TEE?',
    a: 'Yes. IGNOU assignment submission (TMA) is mandatory for TEE eligibility. You must submit both assignments per course within the stipulated deadline. Without submission acknowledgment, your hall ticket will not be issued.',
  },
  {
    q: 'What is the difference between the June TEE and December TEE?',
    a: 'Students who enrolled in the January cycle appear in the June TEE (for that academic year). Students enrolled in the July cycle appear in December TEE. Both cover the same syllabus.',
  },
  {
    q: 'How is the TEE question paper structured?',
    a: 'MAPC theory papers typically have three sections: Section A (long-answer questions, highest marks per question), Section B (medium-answer questions), and Section C (short notes or brief answers). You are expected to attempt a fixed number of questions from each section.',
  },
  {
    q: 'What is the practicum requirement for Year 2 students?',
    a: 'Clinical and Counselling stream students must complete supervised practicum hours (case observations, role-plays, or fieldwork) as part of their MPCL/MPCE practical courses. Organisational stream students have a project/dissertation component. Contact your regional centre for the specific number of hours required.',
  },
  {
    q: 'Can I appear for TEE in all papers in Year 1 simultaneously?',
    a: 'If you are enrolled in the July session you appear for all Year 1 papers in December. You can attempt all six theory papers (MPC-001 to MPC-006) in one sitting, provided assignments are submitted.',
  },
  {
    q: 'What happens if I fail one or more papers?',
    a: 'You can re-appear in any failed paper in the next available TEE session (June or December) without re-enrolling. There is no limit on the number of attempts within the maximum programme duration (generally 5 years for 2-year programmes).',
  },
  {
    q: 'How do I choose my specialisation stream for Year 2?',
    a: 'You declare your specialisation (Clinical, Counselling, or Organisational Psychology) during re-registration for Year 2. Once declared, you take three elective theory papers and the corresponding practical paper for that stream.',
  },
  {
    q: 'Can I change my specialisation stream after Year 1?',
    a: 'In theory you select the stream during Year 2 re-registration, so no change is needed in Year 1. Once Year 2 is registered with a stream, changing it is administratively complex and generally not recommended. Choose carefully.',
  },
  {
    q: 'What is MPCE-046 Applied Positive Psychology?',
    a: 'MPCE-046 is a common elective available to students across all three streams in Year 2. It is not stream-specific. Some students opt for it in addition to their stream papers, but check the current programme guide for your registration rules.',
  },
  {
    q: 'Where can I find official IGNOU MAPC study material?',
    a: 'Printed study material is dispatched by IGNOU to your registered address. Digital versions of all blocks are available on eGyanKosh (egyankosh.ac.in) — free to download. The Topper101 textbook viewer links directly to these materials.',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-black/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold tracking-tight">Topper101</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.login} className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
              Log in
            </Link>
            <Link
              href={signupHref}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1600px] flex">
        <SubjectSidebar />
        <div className="flex-1 min-w-0 mx-auto max-w-5xl px-5 py-16 sm:px-6 lg:px-8 space-y-20">

        {/* ── Hero ── */}
        <section className="text-center space-y-5">
          <div className="inline-block rounded-full bg-teal-50 dark:bg-teal-900/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            Free Guide · 2025–26
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Your IGNOU MAPC<br className="hidden sm:block" /> Study Compass
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
            Program structure, TEE exam format, specialisation streams, practicum requirements
            and the tips 90% of students never find — all in one place, completely free.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              { emoji: '📅', text: '2-year programme' },
              { emoji: '📝', text: 'June & December TEE' },
              { emoji: '🎓', text: '3 specialisation streams' },
              { emoji: '🏠', text: 'Distance learning' },
            ].map(({ emoji, text }) => (
              <span key={text} className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                {emoji} {text}
              </span>
            ))}
          </div>
        </section>

        {/* ── Year 1: Core Papers ── */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Year 1</span>
            <h2 className="mt-1 text-2xl font-bold">Core Theory Papers</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
              All MAPC students take the same six theory papers in Year 1, regardless of stream. These are the
              foundation.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {year1Courses.map((course) => (
              <Link
                key={course.code}
                href={`/courses/${course.code}`}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-teal-700/60 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-500 font-mono">{course.code}</span>
                  <span className="text-xs text-zinc-400 group-hover:text-teal-600 transition-colors">Study →</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-zinc-800 dark:text-zinc-200">
                  {course.name}
                </p>
              </Link>
            ))}
          </div>
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Also in Year 1:</span>{' '}
              <span className="font-mono text-xs bg-zinc-200 dark:bg-zinc-800 rounded px-1.5 py-0.5">MPCL-007</span> Practical
              Work in Psychology — a lab/practical course assessed separately from the TEE.
            </p>
          </div>
        </section>

        {/* ── Year 2: Streams ── */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Year 2</span>
            <h2 className="mt-1 text-2xl font-bold">Specialisation Streams</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
              In Year 2 you choose one specialisation. You take three elective theory papers from that
              stream, plus a practical component and a dissertation/project.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {streamCourses.map(({ id, name, icon, courses }) => (
              <div key={id} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{id}</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{name}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {courses.map((course) => (
                    <Link
                      key={course.code}
                      href={`/courses/${course.code}`}
                      className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800/60 px-3 py-2 hover:border-teal-700/40 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all"
                    >
                      <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-500">{course.code}</span>
                      <span className="text-xs text-zinc-500 max-w-[160px] text-right leading-snug">{course.name}</span>
                    </Link>
                  ))}
                  <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-400">
                    + Practical (MPCL) + Dissertation/Project
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Exam Format ── */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">TEE Format</span>
            <h2 className="mt-1 text-2xl font-bold">How the Exams Work</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
              Term End Examinations (TEE) are held in June and December. Each 3-hour theory paper has
              three sections.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                section: 'Section A',
                type: 'Long answer',
                marks: '10 marks / question',
                tip: 'Descriptive essays. Write 600–800 words. Cover all dimensions: definition, theories, research, application.',
                color: 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/40',
                badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
              },
              {
                section: 'Section B',
                type: 'Medium answer',
                marks: '5 marks / question',
                tip: 'Focused explanations. 300–400 words. Stick to the concept asked — no padding.',
                color: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40',
                badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
              },
              {
                section: 'Section C',
                type: 'Short notes',
                marks: '2 marks / question',
                tip: '100–150 words or bullet points. Precision over length. Define → key points → one example.',
                color: 'bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/40',
                badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
              },
            ].map(({ section, type, marks, tip, color, badge }) => (
              <div key={section} className={`rounded-3xl border p-5 space-y-3 ${color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{section}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge}`}>{marks}</span>
                </div>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">{type}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-2">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Assignment + TEE = Final Grade</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Each course has a Tutor Marked Assignment (TMA) component in addition to the TEE. Both must be
              completed. Assignment submission is mandatory for TEE eligibility.
            </p>
          </div>
        </section>

        {/* ── Study Strategy ── */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Study Strategy</span>
            <h2 className="mt-1 text-2xl font-bold">What Most Students Don&apos;t Know</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                emoji: '📊',
                title: 'The 20/80 Rule applies to MAPC',
                body: 'Analysis of 6+ years of past papers shows that 20% of topic clusters account for 80% of exam questions. Topper101 maps exactly which topics are HIGH frequency. Start there.',
              },
              {
                emoji: '📄',
                title: 'Read the question paper first',
                body: 'Most students open the paper and start from Q1. Instead, read all questions in all three sections first (takes 3 minutes) and choose the ones you can answer best.',
              },
              {
                emoji: '📝',
                title: 'Assignments reveal exam priorities',
                body: 'IGNOU assignments are designed by the same faculty who set TEE papers. Past assignment questions frequently reappear in TEE. Treat them as paid mock exams.',
              },
              {
                emoji: '🔁',
                title: 'Past papers are the best predictor',
                body: 'Questions from 5+ years of past papers repeat every 2–3 years. Practicing past papers for each course gives you a significant statistical advantage over students who only read study material.',
              },
              {
                emoji: '⏰',
                title: 'Submit assignments early',
                body: 'IGNOU assignment deadlines are fixed and non-negotiable. Late submissions mean no TEE eligibility. Plan to submit at least 3 weeks before the deadline to account for postal/portal delays.',
              },
              {
                emoji: '🧠',
                title: 'Use keywords from textbook headings',
                body: 'IGNOU examiners mark based on keyword presence. Each answer should include the exact terminology from the study material — not just the concept, but the specific IGNOU vocabulary.',
              },
            ].map(({ emoji, title, body }) => (
              <div key={title} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{title}</p>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">FAQ</span>
            <h2 className="mt-1 text-2xl font-bold">Common Questions</h2>
          </div>
          <FaqAccordion items={FAQ_ITEMS} />
        </section>

        {/* ── CTA ── */}
        <section className="rounded-3xl bg-teal-700 p-10 text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-white">Ready to study smart?</h2>
          <p className="text-teal-100 text-sm max-w-md mx-auto">
            Topper101 shows you the highest-frequency questions per course, with AI-generated answers
            grounded in your IGNOU textbooks — and now with the actual Q papers and textbooks side by side.
          </p>
          <Link
            href={signupHref}
            className="inline-block rounded-full bg-white text-teal-800 font-bold px-8 py-3 text-sm hover:bg-teal-50 transition-colors"
          >
            Start for free →
          </Link>
        </section>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900 py-8">
        <div className="mx-auto max-w-5xl px-5 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <span>© 2026 Topper101. Not affiliated with IGNOU.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-zinc-600 transition-colors">Home</Link>
            <Link href={ROUTES.pricing} className="hover:text-zinc-600 transition-colors">Pricing</Link>
            <Link href={signupHref} className="hover:text-zinc-600 transition-colors">Sign up free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
