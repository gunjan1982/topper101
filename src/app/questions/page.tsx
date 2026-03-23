'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  marks: number;
  frequency_tag: string | null;
  last_appeared: string | null;
  courses: { code: string; name: string } | null;
}

// Short 1-2 word labels for breadcrumb display
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

export default function QuestionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [activeCourse, setActiveCourse] = useState<string | null>(null); // null = all (MAPC level)

  const freqColor: Record<string, string> = {
    high: '#A13544',
    medium: '#964219',
    low: '#7A7974',
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding'); return; }
      setUserEmail(user.email ?? '');

      // Get enrolled courses from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('enrolled_courses')
        .eq('id', user.id)
        .single();

      const courses: string[] = profile?.enrolled_courses ?? [];
      setEnrolledCourses(courses);

      // Fetch all published questions (filtered to enrolled courses if available)
      let query = supabase
        .from('questions')
        .select('id, question_text, question_type, marks, frequency_tag, last_appeared, courses(code, name)')
        .eq('is_published', true)
        .order('frequency_tag', { ascending: true })
        .limit(50);

      setQuestions((await query).data as unknown as Question[] ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // Filter questions by active course
  const visibleQuestions = activeCourse
    ? questions.filter(q => q.courses?.code === activeCourse)
    : questions;

  // Build breadcrumb
  const breadcrumb = activeCourse
    ? `MAPC > ${activeCourse} · ${SHORT_NAMES[activeCourse] ?? activeCourse}`
    : 'MAPC';

  // Unique course codes from loaded questions, ordered by code
  const coursesInQuestions = Array.from(
    new Map(
      questions
        .filter(q => q.courses)
        .map(q => [q.courses!.code, q.courses!])
    ).values()
  ).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>

      {/* Nav with breadcrumb */}
      <nav style={{ background: 'white', borderBottom: '1px solid #D4D1CA', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#01696F', textDecoration: 'none' }}>Topper101</a>
          <span style={{ color: '#D4D1CA', fontSize: '1rem', margin: '0 0.25rem' }}>|</span>
          {/* Breadcrumb */}
          <span style={{ fontSize: '0.82rem', color: '#7A7974', fontWeight: 500 }}>
            {activeCourse ? (
              <>
                <button
                  onClick={() => setActiveCourse(null)}
                  style={{ background: 'none', border: 'none', color: '#01696F', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
                >
                  MAPC
                </button>
                <span style={{ margin: '0 0.3rem', color: '#D4D1CA' }}>›</span>
                <span style={{ color: '#28251D', fontWeight: 600 }}>{activeCourse}</span>
                <span style={{ color: '#7A7974' }}> · {SHORT_NAMES[activeCourse] ?? ''}</span>
              </>
            ) : (
              <span style={{ color: '#28251D', fontWeight: 600 }}>MAPC</span>
            )}
          </span>
        </div>
        <span style={{ fontSize: '0.82rem', color: '#7A7974' }}>{userEmail}</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Course filter tabs */}
        {!loading && coursesInQuestions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setActiveCourse(null)}
              style={{
                padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                borderColor: !activeCourse ? '#01696F' : '#D4D1CA',
                background: !activeCourse ? '#01696F' : 'white',
                color: !activeCourse ? 'white' : '#7A7974',
              }}
            >
              All
            </button>
            {coursesInQuestions.map(c => (
              <button
                key={c.code}
                onClick={() => setActiveCourse(c.code)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                  borderColor: activeCourse === c.code ? '#01696F' : '#D4D1CA',
                  background: activeCourse === c.code ? '#01696F' : 'white',
                  color: activeCourse === c.code ? 'white' : '#7A7974',
                }}
              >
                {c.code}
              </button>
            ))}
          </div>
        )}

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Question Bank</h1>
        <p style={{ color: '#7A7974', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {activeCourse
            ? `Showing questions for ${activeCourse} · ${SHORT_NAMES[activeCourse] ?? ''}`
            : 'All courses — sorted by exam frequency.'}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>Loading questions…</div>
        )}

        {!loading && visibleQuestions.length === 0 && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', border: '1px solid #D4D1CA' }}>
            <p style={{ color: '#28251D', fontWeight: 600, marginBottom: '0.5rem' }}>No questions yet for this course</p>
            <p style={{ color: '#7A7974', fontSize: '0.9rem' }}>We're adding more questions regularly. Check back soon.</p>
          </div>
        )}

        {visibleQuestions.map(q => (
          <div key={q.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', border: '1px solid #D4D1CA', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A7974', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {q.courses?.code ?? 'MAPC'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#D4D1CA' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#7A7974' }}>{q.marks} Marks</span>
              {q.frequency_tag && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: freqColor[q.frequency_tag] ?? '#7A7974', background: `${freqColor[q.frequency_tag]}15`, padding: '0.2rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {q.frequency_tag} freq.
                </span>
              )}
              {q.last_appeared && (
                <span style={{ fontSize: '0.72rem', color: '#7A7974' }}>Last: {q.last_appeared}</span>
              )}
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#28251D', lineHeight: 1.5 }}>{q.question_text}</p>
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#F7F6F2', borderRadius: '0.4rem', fontSize: '0.8rem', color: '#7A7974', fontStyle: 'italic' }}>
              🔒 AI model answer — upgrade to Exam Pass to unlock
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
