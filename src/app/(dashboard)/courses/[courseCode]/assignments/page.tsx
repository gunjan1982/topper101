import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function AssignmentsListPage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;
  const supabase = await createClient();

  // 1. Resolve Course ID
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, code, course_type, year, stream')
    .eq('code', courseCode)
    .single();

  if (!course) {
    notFound();
  }

  // 2. Fetch Assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, year')
    .eq('course_id', course.id)
    .order('year', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Breadcrumb Nav */}
      <nav className="flex text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-950 dark:hover:text-zinc-300">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${course.code}`} className="hover:text-zinc-950 dark:hover:text-zinc-300">{course.code}</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-950 dark:text-zinc-50">Assignments</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Assignments</h1>
        <p className="mt-2 text-xl text-zinc-600 dark:text-zinc-400">
          Model answers for your {course.code} submissions.
        </p>
      </div>

      {/* Assignment List */}
      <section className="space-y-4">
        {assignments && assignments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/courses/${course.code}/assignments/${assignment.year}`}
                className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm hover:border-teal-600/50 transition-all dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/40">
                    IGNOU Assignment
                  </span>
                  <span className="text-lg opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all text-teal-700 font-bold">
                    →
                  </span>
                </div>
                <h3 className="text-xl font-bold dark:text-white group-hover:text-teal-700 transition-colors">
                  {assignment.year}–{assignment.year + 1}
                </h3>
                <p className="text-zinc-500 text-sm mt-2 dark:text-zinc-400">
                  Full reference map and generated model answers
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-200 p-16 text-center dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">No Assignments Found</h3>
            <p className="mt-2 text-zinc-500/80 font-medium">
              Assignment questions for this course are being added. Check back soon.
            </p>
            <Link 
              href={`/courses/${course.code}`} 
              className="mt-6 inline-block rounded-full bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-600 transition-all active:scale-95"
            >
              Back to Course
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
