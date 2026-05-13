import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import QuestionCard from './components/QuestionCard';

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseCode: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { courseCode } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  
  // Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('code', courseCode)
    .single();

  if (!course) {
    notFound();
  }

  // Fetch topic clusters
  const { data: clusters } = await supabase
    .from('topic_clusters')
    .select('*')
    .eq('course_id', course.id)
    .order('frequency_count', { ascending: false });

  // Fetch questions
  let query = supabase
    .from('questions')
    .select('*')
    .eq('course_id', course.id);

  // Apply filters from searchParams
  if (resolvedSearchParams.year) query = query.eq('year', parseInt(resolvedSearchParams.year));
  if (resolvedSearchParams.session) query = query.eq('session', resolvedSearchParams.session);
  if (resolvedSearchParams.cluster) {
    // Find cluster name from already-fetched clusters, then filter by topic field
    const matchedCluster = clusters?.find((c) => c.id === resolvedSearchParams.cluster);
    if (matchedCluster) query = query.eq('topic', matchedCluster.cluster_name);
  }

  const { data: questions } = await query.order('created_at', { ascending: false });

  // Only show year filter pills if at least some questions have a year value
  const hasYearData = (questions ?? []).some((q: any) => q.year != null);

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-950">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-950 dark:text-zinc-50">{course.code}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{course.code}</h1>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Year {course.year} {course.stream ? `· ${course.stream}` : ''}
            </span>
          </div>
          <p className="mt-2 text-xl text-zinc-600 dark:text-zinc-400">{course.name}</p>
        </div>
        <div className="flex items-center gap-4">
          {course.course_type === 'theory' && (
            <Link
              href={`/courses/${course.code}/assignments`}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm ring-1 ring-inset ring-zinc-200 hover:ring-teal-600/50 hover:text-teal-700 transition-all dark:bg-zinc-900 dark:ring-zinc-700 dark:text-zinc-400"
            >
              Assignments
            </Link>
          )}
          <div className="text-sm font-medium text-zinc-500">
            {questions?.length || 0} Questions Available
          </div>
        </div>
      </div>

      {/* Heat Map Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Frequency Heat Map</h2>
          {resolvedSearchParams.cluster && (
            <Link href={`/courses/${course.code}`} className="text-xs font-bold text-teal-700">Clear Filter</Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clusters && clusters.length > 0 ? (
            clusters.map((cluster) => (
              <Link
                key={cluster.id} 
                href={`/courses/${course.code}?cluster=${cluster.id}`}
                className={`group rounded-2xl border p-5 transition-all hover:shadow-md hover:border-teal-600/50 ${
                  resolvedSearchParams.cluster === cluster.id ? 'ring-2 ring-teal-700 ring-offset-2' : ''
                } ${
                  cluster.frequency_tier === 'HIGH' 
                    ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10' 
                    : cluster.frequency_tier === 'MEDIUM'
                    ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10'
                    : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      cluster.frequency_tier === 'HIGH' ? 'text-red-600' : cluster.frequency_tier === 'MEDIUM' ? 'text-amber-600' : 'text-zinc-500'
                    }`}>
                      {cluster.frequency_tier} Tier
                    </span>
                    {cluster.frequency_tier === 'HIGH' && <span className="text-sm">🔥</span>}
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    {cluster.frequency_count} exams
                  </span>
                </div>
                <h3 className="font-bold group-hover:text-teal-700 transition-colors dark:text-white">{cluster.cluster_name}</h3>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-800">
              No frequency data available for this course yet.
            </div>
          )}
        </div>
      </section>

      {/* Question List Section */}
      <section className="space-y-6">
        <div className="sticky top-[73px] z-30 flex flex-wrap items-center gap-4 bg-zinc-50/80 py-4 backdrop-blur-md dark:bg-black/80">
          <h2 className="text-lg font-bold dark:text-white">
            {resolvedSearchParams.cluster ? 'Filtered Questions' : 'Past Paper Questions'}
          </h2>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Year Filter Pills — only shown when year data is available */}
            {hasYearData && ['2023', '2022', '2021'].map((year) => (
              <Link
                key={year}
                href={`/courses/${course.code}?year=${year}${resolvedSearchParams.cluster ? `&cluster=${resolvedSearchParams.cluster}` : ''}`}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  resolvedSearchParams.year === year ? 'bg-teal-700 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-teal-700 dark:bg-zinc-900 dark:border-zinc-800'
                }`}
              >
                {year}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {questions && questions.length > 0 ? (
            questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 p-20 text-center dark:border-zinc-800">
              <p className="text-zinc-500 font-medium italic">
                No questions found matching your filters. <br/>
                <Link href={`/courses/${course.code}`} className="mt-2 inline-block text-teal-700 underline">Clear all filters</Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
