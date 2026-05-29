import { createAdminClient } from '@/lib/supabase/admin';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';
import QuestionReviewCard, { QuestionWithCourse } from './QuestionReviewCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    course?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AdminQAPage({ searchParams }: PageProps) {
  const {
    course = '',
    status = 'unreviewed',
    search = '',
    page = '1',
  } = await searchParams;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSize = 10;
  const offset = (pageNum - 1) * pageSize;

  const admin = createAdminClient();

  // 1. Fetch statistics for the top KPI row
  const [
    { count: totalCount },
    { count: humanReviewedCount },
    { count: draftCount },
    { count: publishedCount },
  ] = await Promise.all([
    admin.from('questions').select('id', { count: 'exact', head: true }),
    admin.from('questions').select('id', { count: 'exact', head: true }).eq('reviewed_by_human', true),
    admin.from('questions').select('id', { count: 'exact', head: true }).eq('answer_status', 'draft'),
    admin.from('questions').select('id', { count: 'exact', head: true }).eq('answer_status', 'published'),
  ]);

  const totalQuestions = totalCount ?? 0;
  const reviewedQuestions = humanReviewedCount ?? 0;
  const draftAnswers = draftCount ?? 0;
  const publishedAnswers = publishedCount ?? 0;
  const progressPercentage = totalQuestions > 0 ? Math.round((reviewedQuestions / totalQuestions) * 100) : 0;

  // 2. Fetch all courses for the dropdown filter
  const { data: coursesData } = await admin
    .from('courses')
    .select('id, code, name')
    .order('code', { ascending: true });
  const courses = coursesData ?? [];

  // 3. Query questions with filters and pagination
  let query = admin
    .from('questions')
    .select('*, courses(code, name)', { count: 'exact' });

  if (course) {
    query = query.eq('course_id', course);
  }

  if (status === 'unreviewed') {
    query = query.eq('reviewed_by_human', false);
  } else if (status === 'draft') {
    query = query.eq('answer_status', 'draft');
  } else if (status === 'published') {
    query = query.eq('answer_status', 'published');
  }

  if (search) {
    query = query.ilike('question_text', `%${search}%`);
  }

  // Deterministic sorting ordering
  query = query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data: questionsData, count: filteredCount } = await query;
  const questions = (questionsData as unknown as QuestionWithCourse[]) ?? [];
  const totalFilteredCount = filteredCount ?? 0;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  // Build query string helper for pagination
  const getQueryString = (newPageNum: number) => {
    const params = new URLSearchParams();
    if (course) params.set('course', course);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    params.set('page', newPageNum.toString());
    return `${ROUTES.adminRequests}?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">AI QA Console</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Audit, edit, and approve AI answers side-by-side with textbook page references.
          </p>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Questions</div>
          <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">{totalQuestions}</div>
          <div className="mt-1 text-xs text-zinc-500">Total questions in database</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Human Reviewed</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {reviewedQuestions} <span className="text-sm font-semibold text-zinc-400">({progressPercentage}%)</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-zinc-150 dark:bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-emerald-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Draft Answers</div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">{draftAnswers}</div>
          <div className="mt-1 text-xs text-zinc-500">Status is set to &apos;draft&apos;</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Published Answers</div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">{publishedAnswers}</div>
          <div className="mt-1 text-xs text-zinc-500">Visible to active students</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Unreviewed</div>
          <div className="mt-2 text-2xl font-black text-zinc-700 dark:text-zinc-300">
            {totalQuestions - reviewedQuestions}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Pending human review</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <form method="GET" className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Search Question */}
          <div className="flex-1 space-y-1.5">
            <label htmlFor="search-input" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Search Question Text
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
                </svg>
              </span>
              <input
                id="search-input"
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search queries, concepts, keywords..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          {/* Select Course */}
          <div className="w-full sm:w-64 space-y-1.5">
            <label htmlFor="course-select" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Course Code
            </label>
            <select
              id="course-select"
              name="course"
              defaultValue={course}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name.slice(0, 30)}
                  {c.name.length > 30 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Select Status */}
          <div className="w-full sm:w-56 space-y-1.5">
            <label htmlFor="status-select" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Review Status
            </label>
            <select
              id="status-select"
              name="status"
              defaultValue={status}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="unreviewed">Unreviewed by Human</option>
              <option value="draft">Draft AI Answers</option>
              <option value="published">Published Answers</option>
              <option value="all">All Questions</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-initial rounded-xl bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Filter
            </button>

            {(course || status !== 'unreviewed' || search) && (
              <Link
                href={ROUTES.adminRequests}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Review Count Info */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <div>
          Found <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalFilteredCount}</span>{' '}
          questions matching filters.
        </div>
      </div>

      {/* Question Cards Stack */}
      {questions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-16 text-center dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="mx-auto max-w-sm space-y-2">
            <svg className="mx-auto h-10 w-10 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.25 2.25 0 009.24 2.25m6.8 0h.008v.008H16.05v-.008zm-6.8 0h.008v.008H9.25v-.008zM5.25 5.682C4.135 5.777 3.29 6.74 3.29 7.875v10.02c0 1.135.845 2.098 1.976 2.192m1.123-.08A48.245 48.245 0 0118 20.25M6.375 20.25h11.25" />
            </svg>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">All caught up!</h3>
            <p className="text-sm text-zinc-500">No questions require review matching these filters.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q) => (
            <QuestionReviewCard key={q.id} question={q} />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200/80 bg-zinc-50/50 rounded-2xl p-5 dark:border-zinc-800/80 dark:bg-zinc-950/20">
          <div className="text-sm text-zinc-500">
            Showing <span className="font-semibold">{questions.length}</span> of{' '}
            <span className="font-semibold">{totalFilteredCount}</span> items (Page{' '}
            <span className="font-semibold">{pageNum}</span> of {totalPages})
          </div>
          <div className="flex gap-2">
            <Link
              href={getQueryString(pageNum - 1)}
              className={`rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 ${
                pageNum <= 1 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Previous
            </Link>
            <Link
              href={getQueryString(pageNum + 1)}
              className={`rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 ${
                pageNum >= totalPages ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
