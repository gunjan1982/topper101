'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface CourseStats {
  code: string;
  name: string;
  total: number;
  high: number;
  medium: number;
  low: number;
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

const YEAR_LABEL: Record<string, string> = {
  'MPC-001': 'Year 1 · Core',
  'MPC-002': 'Year 1 · Core',
  'MPC-003': 'Year 1 · Core',
  'MPC-004': 'Year 1 · Core',
  'MPC-005': 'Year 1 · Core',
  'MPC-006': 'Year 1 · Core',
  'MPCE-11': 'Year 2 · Clinical',
  'MPCE-12': 'Year 2 · Clinical',
  'MPCE-13': 'Year 2 · Clinical',
  'MPCE-21': 'Year 2 · Counselling',
  'MPCE-22': 'Year 2 · Counselling',
  'MPCE-23': 'Year 2 · Counselling',
  'MPCE-31': 'Year 2 · I/O',
  'MPCE-32': 'Year 2 · I/O',
  'MPCE-33': 'Year 2 · I/O',
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [teeSession, setTeeSession] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [freeCourse, setFreeCourse] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding'); return; }
      setUserEmail(user.email ?? '');

      // Load profile — include free_course and subscription_tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('enrolled_courses, exam_date, free_course, subscription_tier')
        .eq('id', user.id)
        .single();

      const courses: string[] = profile?.enrolled_courses ?? [];
      setEnrolledCourses(courses);

      const tier = profile?.subscription_tier ?? 'free';
      setSubscriptionTier(tier);

      // Only apply free_course gate for free tier users
      const fc = tier === 'free' ? (profile?.free_course ?? null) : null;
      setFreeCourse(fc);

      // Derive TEE label from exam_date
      const examDate: string = profile?.exam_date ?? '';
      if (examDate.startsWith('2026-06')) setTeeSession('TEE June 2026');
      else if (examDate.startsWith('2026-12')) setTeeSession('TEE December 2026');
      else if (examDate.startsWith('2027-06')) setTeeSession('TEE June 2027');
      else setTeeSession('');

      // Fetch all published questions for enrolled courses
      const { data: questions } = await supabase
        .from('questions')
        .select('frequency_tag, courses(code, name)')
        .eq('is_published', true);

      // Build per-course stats
      const statsMap: Record<string, CourseStats> = {};
      (questions ?? []).forEach((q: any) => {
        const code = q.courses?.code;
        const name = q.courses?.name;
        if (!code || !courses.includes(code)) return;
        if (!statsMap[code]) statsMap[code] = { code, name, total: 0, high: 0, medium: 0, low: 0 };
        statsMap[code].total++;
        if (q.frequency_tag === 'high') statsMap[code].high++;
        else if (q.frequency_tag === 'medium') statsMap[code].medium++;
        else statsMap[code].low++;
      });

      setCourseStats(Object.values(statsMap).sort((a, b) => a.code.localeCompare(b.code)));
      setLoading(false);
    }
    load();
  }, []);

  const daysLeft = () => {
    if (!teeSession) return null;
    const target = teeSession.includes('Jun 2026') ? new Date('2026-06-01')
      : teeSession.includes('Dec 2026') ? new Date('2026-12-01')
      : new Date('2027-06-01');
    const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : null;
  };

  const days = daysLeft();
  const isPaid = subscriptionTier !== 'free';
  // Count locked courses (for CTA copy)
  const lockedCount = freeCourse ? courseStats.filter(cs => cs.code !== freeCourse).length : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #D4D1CA', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#01696F', textDecoration: 'none' }}>Topper101</a>
          <span style={{ color: '#D4D1CA', margin: '0 0.25rem' }}>|</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#28251D' }}>MAPC</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isPaid && (
            <button
              onClick={() => router.push('/upgrade')}
              style={{ padding: '0.35rem 0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Upgrade
            </button>
          )}
          <span style={{ fontSize: '0.82rem', color: '#7A7974' }}>{userEmail}</span>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* TEE countdown banner */}
        {teeSession && days && (
          <div style={{ background: '#01696F', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Preparing for</p>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{teeSession}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '2rem', lineHeight: 1 }}>{days}</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>days left</p>
            </div>
          </div>
        )}

        {/* Freemium notice banner — only for free users with a free_course set */}
        {!isPaid && freeCourse && (
          <div style={{ background: '#F7F6F2', border: '1.5px solid #D4D1CA', borderRadius: '0.75rem', padding: '0.9rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#28251D', marginBottom: '0.15rem' }}>
                Free plan — 1 subject unlocked
              </p>
              <p style={{ fontSize: '0.78rem', color: '#7A7974' }}>
                <strong style={{ color: '#01696F' }}>{freeCourse} · {SHORT_NAMES[freeCourse] ?? freeCourse}</strong> is fully open.
                {lockedCount > 0 && ` Upgrade to unlock all ${lockedCount + 1} subjects.`}
              </p>
            </div>
            <button
              onClick={() => router.push('/upgrade')}
              style={{ padding: '0.5rem 1.1rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              See plans →
            </button>
          </div>
        )}

        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Your Courses</h1>
        <p style={{ color: '#7A7974', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          Tap a course to see past paper questions, sorted by exam frequency.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>Loading…</div>
        )}

        {!loading && courseStats.length === 0 && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', border: '1px solid #D4D1CA' }}>
            <p style={{ color: '#28251D', fontWeight: 600 }}>No questions yet for your courses</p>
            <p style={{ color: '#7A7974', fontSize: '0.875rem', marginTop: '0.5rem' }}>We're adding content regularly. Check back soon.</p>
          </div>
        )}

        {courseStats.map(cs => {
          const isFree = isPaid || freeCourse === cs.code;
          const isLocked = !isFree;
          const highPct = cs.total > 0 ? Math.round((cs.high / cs.total) * 100) : 0;
          const medPct = cs.total > 0 ? Math.round((cs.medium / cs.total) * 100) : 0;

          return (
            <div
              key={cs.code}
              onClick={() => router.push(`/questions?course=${cs.code}`)}
              style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', border: `1.5px solid ${isFree && freeCourse === cs.code ? '#01696F' : '#D4D1CA'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative', opacity: isLocked ? 0.75 : 1 }}
            >
              {/* Status badge */}
              {isLocked && (
                <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.72rem', fontWeight: 700, color: '#964219', background: '#96421915', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  🔒 Upgrade
                </span>
              )}
              {!isLocked && freeCourse === cs.code && (
                <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.72rem', fontWeight: 700, color: '#01696F', background: '#01696F15', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  ✓ Free
                </span>
              )}
              {isPaid && (
                <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.72rem', fontWeight: 700, color: '#01696F', background: '#01696F15', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  ✓ Unlocked
                </span>
              )}

              {/* Course header */}
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7A7974', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{YEAR_LABEL[cs.code] ?? 'MAPC'}</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#28251D', marginTop: '0.2rem' }}>
                  {cs.code} · {SHORT_NAMES[cs.code] ?? cs.name}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#7A7974', marginTop: '0.1rem' }}>{cs.total} past paper questions</p>
              </div>

              {/* Frequency bar */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '8px', background: '#F7F6F2' }}>
                  {cs.high > 0 && <div style={{ width: `${highPct}%`, background: '#A13544' }} />}
                  {cs.medium > 0 && <div style={{ width: `${medPct}%`, background: '#964219' }} />}
                  {(cs.low > 0 || (cs.total - cs.high - cs.medium) > 0) && <div style={{ flex: 1, background: '#D4D1CA' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem' }}>
                <span style={{ color: '#A13544', fontWeight: 600 }}>● {cs.high} High freq.</span>
                <span style={{ color: '#964219', fontWeight: 600 }}>● {cs.medium} Medium</span>
                <span style={{ color: '#7A7974' }}>● {cs.low} Low</span>
              </div>
            </div>
          );
        })}

        {/* Upgrade CTA strip at bottom */}
        {!isPaid && lockedCount > 0 && (
          <div style={{ marginTop: '1rem', background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', border: '1.5px solid #D4D1CA', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Unlock all {courseStats.length} subjects</p>
            <p style={{ color: '#7A7974', fontSize: '0.875rem', marginBottom: '1rem' }}>Get full access to every question bank + AI model answers</p>
            <button
              onClick={() => router.push('/upgrade')}
              style={{ padding: '0.75rem 2rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
            >
              See plans →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
