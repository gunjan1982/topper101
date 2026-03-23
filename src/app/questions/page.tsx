'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  marks: number;
  probability: number | null;
  frequency_tag: string | null;
  topic: string | null;
  last_appeared: string | null;
  courses: { code: string; name: string } | null;
}

const SHORT_NAMES: Record<string, string> = {
  'MPC-001': 'Cognitive Psych.',
  'MPC-002': 'Life Span',
  'MPC-003': 'Personality',
  'MPC-004': 'Social Psych.',
  'MPC-005': 'Research Methods',
  'MPC-006': 'Statistics',
  'MPCE-11': 'Psychopathology',
  'MPCE-12': 'Psychodiagnostics',
  'MPCE-13': 'Psychotherapy',
  'MPCE-21': 'Counselling',
  'MPCE-22': 'Assessment',
  'MPCE-23': 'Interventions',
  'MPCE-31': 'Org. Behaviour',
  'MPCE-32': 'HRD',
  'MPCE-33': 'Org. Development',
};

function ProbabilityBadge({ value }: { value: number | null }) {
  if (!value) return null;
  const color = value >= 75 ? '#A13544' : value >= 50 ? '#964219' : '#7A7974';
  const bg = value >= 75 ? '#A1354415' : value >= 50 ? '#96421915' : '#7A797415';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.72rem', fontWeight: 700, color, background: bg,
      padding: '0.2rem 0.55rem', borderRadius: '999px',
    }}>
      <span style={{ fontSize: '0.65rem' }}>▲</span> {value}% likely
    </span>
  );
}

function QuestionsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [activeCourse, setActiveCourse] = useState<string>(
    searchParams.get('course') ?? ''
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding'); return; }
      setUserEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('enrolled_courses')
        .eq('id', user.id)
        .single();

      const courses: string[] = profile?.enrolled_courses ?? [];
      setEnrolledCourses(courses);

      // Default to first enrolled course if none in URL
      if (!searchParams.get('course') && courses.length > 0) {
        setActiveCourse(courses[0]);
      }

      const { data } = await supabase
        .from('questions')
        .select('id, question_text, question_type, marks, probability, frequency_tag, topic, last_appeared, courses(code, name)')
        .eq('is_published', true)
        .order('probability', { ascending: false, nullsFirst: false })
        .limit(100);

      setQuestions((data as unknown as Question[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Questions for active course, sorted by probability desc
  const courseQuestions = questions
    .filter(q => q.courses?.code === activeCourse)
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0));

  const topQuestions = courseQuestions.slice(0, 5);
  const lockedQuestions = courseQuestions.slice(5);

  const activeName = SHORT_NAMES[activeCourse] ?? activeCourse;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>

      {/* Nav with breadcrumb */}
      <nav style={{ background: 'white', borderBottom: '1px solid #D4D1CA', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#01696F', textDecoration: 'none', flexShrink: 0 }}>Topper101</a>
          <span style={{ color: '#D4D1CA', margin: '0 0.1rem' }}>|</span>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#01696F', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0, flexShrink: 0 }}
          >
            MAPC
          </button>
          {activeCourse && (
            <>
              <span style={{ color: '#D4D1CA', fontSize: '0.9rem' }}>›</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#28251D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCourse} · {activeName}
              </span>
            </>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: '#7A7974', flexShrink: 0, marginLeft: '0.5rem' }}>{userEmail}</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Subject dropdown */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#7A7974', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            Subject
          </label>
          <select
            value={activeCourse}
            onChange={e => setActiveCourse(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #D4D1CA', borderRadius: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#28251D', background: 'white', outline: 'none', cursor: 'pointer', appearance: 'auto' }}
          >
            {enrolledCourses.length === 0 && <option value="">Loading…</option>}
            {enrolledCourses.map(code => (
              <option key={code} value={code}>
                {code} — {SHORT_NAMES[code] ?? code}
              </option>
            ))}
          </select>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#28251D', marginBottom: '0.2rem' }}>
            Question Bank
          </h1>
          <p style={{ color: '#7A7974', fontSize: '0.875rem' }}>
            {activeCourse
              ? `${courseQuestions.length} questions · sorted by exam probability`
              : 'Select a subject above'}
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>Loading…</div>
        )}

        {/* Top 5 visible questions */}
        {topQuestions.map((q, i) => (
          <div key={q.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', border: '1px solid #D4D1CA', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Rank */}
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: i < 3 ? '#A13544' : '#7A7974', background: i < 3 ? '#A1354415' : '#F7F6F2', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <ProbabilityBadge value={q.probability} />
                <span style={{ fontSize: '0.72rem', color: '#7A7974' }}>{q.marks} marks</span>
                {q.last_appeared && (
                  <span style={{ fontSize: '0.72rem', color: '#7A7974' }}>Last: {q.last_appeared}</span>
                )}
              </div>
            </div>
            {/* Topic */}
            {q.topic && (
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#01696F', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                {q.topic}
              </p>
            )}
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#28251D', lineHeight: 1.5, marginBottom: '0.75rem' }}>{q.question_text}</p>
            <div style={{ padding: '0.6rem 0.75rem', background: '#F7F6F2', borderRadius: '0.4rem', fontSize: '0.8rem', color: '#7A7974', fontStyle: 'italic' }}>
              🔒 AI model answer — upgrade to Exam Pass to unlock
            </div>
          </div>
        ))}

        {/* Locked questions — blurred */}
        {lockedQuestions.length > 0 && (
          <div style={{ position: 'relative' }}>
            {/* Show 2 blurred cards */}
            {lockedQuestions.slice(0, 2).map((q) => (
              <div key={q.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', border: '1px solid #D4D1CA', filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <ProbabilityBadge value={q.probability} />
                  <span style={{ fontSize: '0.72rem', color: '#7A7974' }}>{q.marks} marks</span>
                </div>
                {q.topic && <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#01696F', marginBottom: '0.4rem' }}>{q.topic}</p>}
                <p style={{ fontSize: '1rem', fontWeight: 600, color: '#28251D', lineHeight: 1.5 }}>{q.question_text}</p>
              </div>
            ))}

            {/* Upgrade overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: '30%', background: 'linear-gradient(to bottom, transparent, #F7F6F2 40%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: '#28251D', fontSize: '1rem', marginBottom: '0.25rem' }}>
                +{lockedQuestions.length} more questions in this subject
              </p>
              <p style={{ color: '#7A7974', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Unlock all questions + AI model answers
              </p>
              <button
                onClick={() => router.push('/upgrade')}
                style={{ padding: '0.75rem 2rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Upgrade to Exam Pass →
              </button>
            </div>
          </div>
        )}

        {!loading && courseQuestions.length === 0 && activeCourse && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', border: '1px solid #D4D1CA' }}>
            <p style={{ color: '#28251D', fontWeight: 600, marginBottom: '0.5rem' }}>No questions yet for {activeCourse}</p>
            <p style={{ color: '#7A7974', fontSize: '0.875rem' }}>We're adding more questions regularly.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return <Suspense><QuestionsPageInner /></Suspense>;
}
