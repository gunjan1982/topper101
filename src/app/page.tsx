import Link from 'next/link';
import Logo from './Logo';
import { withRedirectTo } from '@/lib/navigation';
import { ROUTES } from '@/lib/routes';
import ConceptTreePreview, { type PublicCoursePreview } from './ConceptTreePreview';
import ExamSchedulePreview from './ExamSchedulePreview';
import { SUPPORT_EMAIL } from '@/lib/contact';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'Topper101 — IGNOU MAPC Exam Prep',
  description:
    'See the 20% of topics behind 80% of IGNOU MAPC exam questions. AI-powered exam prep built specifically for IGNOU MAPC students.',
};

async function fetchConceptPreviewData(): Promise<PublicCoursePreview[]> {
  try {
    const supabase = createAdminClient();

    const [coursesRes, clustersRes, questionCoursesRes] = await Promise.all([
      supabase
        .from('courses')
        .select('id, code, name, year, stream')
        .eq('course_type', 'theory')
        .order('code'),
      supabase
        .from('topic_clusters')
        .select('course_id, cluster_name, frequency_tier, frequency_count')
        .order('frequency_count', { ascending: false }),
      supabase
        .from('questions')
        .select('course_id'),
    ]);

    const courses = coursesRes.data ?? [];
    const clusters = clustersRes.data ?? [];
    const questionCourses = questionCoursesRes.data ?? [];

    // Count questions per course
    const qCountByCourse = new Map<string, number>();
    for (const q of questionCourses) {
      qCountByCourse.set(q.course_id, (qCountByCourse.get(q.course_id) ?? 0) + 1);
    }

    // Group clusters by course_id
    const clustersByCourse = new Map<string, typeof clusters>();
    for (const c of clusters) {
      const list = clustersByCourse.get(c.course_id) ?? [];
      list.push(c);
      clustersByCourse.set(c.course_id, list);
    }

    return courses.map((course) => ({
      code: course.code,
      name: course.name,
      year: course.year,
      stream: course.stream ?? null,
      questionCount: qCountByCourse.get(course.id) ?? 0,
      clusters: (clustersByCourse.get(course.id) ?? []).map((c) => ({
        name: c.cluster_name,
        tier: (c.frequency_tier ?? 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
        exams: c.frequency_count ?? 0,
      })),
    }));
  } catch {
    return [];
  }
}

const startFreeHref = withRedirectTo(ROUTES.signup, ROUTES.dashboard);
const upgradeHref = withRedirectTo(ROUTES.signup, ROUTES.pricing);

export default async function LandingPage() {
  const conceptPreviewCourses = await fetchConceptPreviewData();
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-black/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-xl font-bold tracking-tight">Topper101</span>
          </div>
          <div className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#exam-schedule" className="hover:text-teal-700">Exam Schedule</a>
            <a href="#concept-tree" className="hover:text-teal-700">Concept Tree</a>
            <a href="#features" className="hover:text-teal-700">Features</a>
            <a href="#pricing" className="hover:text-teal-700">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.login} className="text-sm font-medium hover:text-teal-700">
              Log in
            </Link>
            <Link
              href={startFreeHref}
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition-all hover:bg-teal-600 active:scale-95"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="relative overflow-hidden px-5 pb-20 pt-20 text-center sm:px-6 md:pb-28 md:pt-28">
          <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-[420px] max-w-5xl bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.16),transparent_62%)]" />
          <div className="mx-auto max-w-5xl">
            <h1 className="text-balance text-4xl font-extrabold tracking-normal sm:text-6xl lg:text-7xl">
              See the{' '}
              <span className="bg-gradient-to-r from-teal-700 via-sky-700 to-violet-600 bg-clip-text text-transparent">
                20% of topics
              </span>{' '}
              behind 80% of IGNOU MAPC exam questions.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-pretty text-lg leading-8 text-zinc-600 dark:text-zinc-400 sm:text-xl">
              Official June 2026 TEE dates plus repeat-question heat maps for IGNOU MAPC students. Stop studying everything and start studying what matters.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={startFreeHref}
                className="w-full rounded-full bg-teal-700 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-teal-700/30 transition-all hover:bg-teal-600 active:scale-95 sm:w-auto"
              >
                Start Free →
              </Link>
              <a
                href="#exam-schedule"
                className="w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-zinc-950 ring-1 ring-zinc-200 transition-all hover:bg-zinc-50 active:scale-95 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800 dark:hover:bg-zinc-800 sm:w-auto"
              >
                Find my first exam
              </a>
            </div>
            <p className="mt-16 text-sm font-medium uppercase tracking-widest text-zinc-400">
              Not guess papers. Probability-led study maps.
            </p>
          </div>
        </section>

        <ExamSchedulePreview />

        <ConceptTreePreview courses={conceptPreviewCourses} />

        <section id="features" className="px-5 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-normal sm:text-5xl">Study smarter, not longer.</h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Three steps to exam confidence.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { step: '01', title: 'Pick your papers', desc: 'Select the MPC or MPCE codes you are writing this TEE.' },
                { step: '02', title: 'See what repeats', desc: 'Frequency clusters show which topics deserve attention first.' },
                { step: '03', title: 'Practise answers', desc: 'Use model answers shaped around marks, sections, and word count.' },
              ].map((item) => (
                <div key={item.step} className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
                  <div className="mb-4 text-3xl font-black text-teal-700/30">{item.step}</div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-zinc-50 px-5 py-20 dark:bg-zinc-950 sm:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-normal sm:text-5xl">Simple pricing for exam season.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { name: 'Free', price: '₹0', features: ['1 full subject unlocked', 'Paper selection', 'Basic progress tracking'] },
                { name: 'Pass: 1 Subject', price: '₹99', period: '/mo', features: ['1 subject unlocked', 'AI answer views', 'Frequency heat map'] },
                { name: 'Pass: 5 Subjects', price: '₹299', period: '/mo', highlight: true, features: ['Up to 5 subjects unlocked', 'AI answer views', 'Frequency heat map'] },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-lg border p-6 ${
                  plan.highlight
                    ? 'border-teal-700 bg-white shadow-xl shadow-teal-700/10 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                }`}>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-zinc-500">{plan.period}</span>}
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-700" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.name === 'Free' ? startFreeHref : upgradeHref}
                    className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-bold transition-all ${
                      plan.highlight
                        ? 'bg-teal-700 text-white hover:bg-teal-600'
                        : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-teal-700 px-5 py-20 text-white sm:px-6 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-normal sm:text-5xl">Ready to know what to study first?</h2>
            <p className="mt-6 text-xl text-teal-50">Start with your papers, then let Topper101 shape the question bank around them.</p>
            <div className="mt-10">
              <Link
                href={startFreeHref}
                className="inline-flex rounded-full bg-white px-10 py-5 text-lg font-bold text-teal-700 shadow-xl transition-all hover:bg-teal-50 active:scale-95"
              >
                Start Free →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-200 px-5 py-8 text-sm text-zinc-500 dark:border-zinc-800 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Topper101</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium hover:text-teal-700">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </div>
  );
}
