'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const YEAR1_COURSES = [
  { code: 'MPC-001', name: 'Cognitive Psychology' },
  { code: 'MPC-002', name: 'Life Span Psychology' },
  { code: 'MPC-003', name: 'Personality: Theories and Assessment' },
  { code: 'MPC-004', name: 'Advanced Social Psychology' },
  { code: 'MPC-005', name: 'Research Methods in Psychology' },
  { code: 'MPC-006', name: 'Statistics in Psychology' },
];

const YEAR2_STREAMS = {
  'Group A — Clinical Psychology': [
    { code: 'MPCE-11', name: 'Psychopathology' },
    { code: 'MPCE-12', name: 'Psychodiagnostics' },
    { code: 'MPCE-13', name: 'Psychotherapeutic Methods' },
  ],
  'Group B — Counselling Psychology': [
    { code: 'MPCE-21', name: 'Counselling Psychology' },
    { code: 'MPCE-22', name: 'Assessment in Counselling and Guidance' },
    { code: 'MPCE-23', name: 'Interventions in Counselling' },
  ],
  'Group C — I/O Psychology': [
    { code: 'MPCE-31', name: 'Organisational Behaviour' },
    { code: 'MPCE-32', name: 'Human Resource Development' },
    { code: 'MPCE-33', name: 'Organisational Development' },
  ],
};

type Step = 'email' | 'otp' | 'courses' | 'examdate';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [examDate, setExamDate] = useState('2026-06-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendOtp() {
    setLoading(true);
    setError('');
    // Pass emailRedirectTo pointing to production — this also signals Supabase
    // to send a 6-digit OTP code (not a magic link) when OTP is enabled in dashboard.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setError(error.message); } else { setStep('otp'); }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) { setError(error.message); } else { setStep('courses'); }
    setLoading(false);
  }

  function toggleCourse(code: string) {
    setSelectedCourses(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  }

  async function saveProfile() {
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Session expired. Please start again.'); setLoading(false); return; }

    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      email: user.email!,
      enrolled_courses: selectedCourses,
      exam_date: examDate,
      subscription_tier: 'free',
    });

    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/questions');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '1rem', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

        {/* Logo */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#01696F' }}>Topper101</span>
          <p style={{ color: '#7A7974', marginTop: '0.25rem', fontSize: '0.9rem' }}>IGNOU MAPC Exam Prep</p>
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.5rem' }}>Start for free</h1>
            <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>We'll send a 6-digit code to your email — no password needed.</p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#28251D', marginBottom: '0.4rem' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #D4D1CA', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#A13544', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading || !email}
              style={{ marginTop: '1rem', width: '100%', padding: '0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading || !email ? 0.6 : 1 }}
            >
              {loading ? 'Sending…' : 'Send code →'}
            </button>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.5rem' }}>Check your email</h1>
            <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter the 6-digit code sent to <strong>{email}</strong></p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#28251D', marginBottom: '0.4rem' }}>Verification code</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #D4D1CA', borderRadius: '0.5rem', fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#A13544', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
              style={{ marginTop: '1rem', width: '100%', padding: '0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading || otp.length < 6 ? 0.6 : 1 }}
            >
              {loading ? 'Verifying…' : 'Verify →'}
            </button>
            <button onClick={() => setStep('email')} style={{ marginTop: '0.75rem', width: '100%', background: 'none', border: 'none', color: '#7A7974', fontSize: '0.85rem', cursor: 'pointer' }}>
              ← Use a different email
            </button>
          </div>
        )}

        {/* Step: Courses */}
        {step === 'courses' && (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Which courses are you studying?</h1>
            <p style={{ color: '#7A7974', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Select all that apply — we'll filter questions accordingly.</p>

            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#01696F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Year 1 (Core)</p>
            {YEAR1_COURSES.map(c => (
              <button key={c.code} onClick={() => toggleCourse(c.code)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.6rem 0.75rem', marginBottom: '0.4rem', border: `1.5px solid ${selectedCourses.includes(c.code) ? '#01696F' : '#D4D1CA'}`, borderRadius: '0.5rem', background: selectedCourses.includes(c.code) ? '#01696F10' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selectedCourses.includes(c.code) ? '#01696F' : '#D4D1CA'}`, background: selectedCourses.includes(c.code) ? '#01696F' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedCourses.includes(c.code) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#28251D' }}><strong>{c.code}</strong> — {c.name}</span>
              </button>
            ))}

            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#01696F', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.25rem' }}>Year 2 — Specialisation (pick one group)</p>
            <p style={{ fontSize: '0.75rem', color: '#7A7974', marginBottom: '0.75rem' }}>Select the 3 courses from your specialisation group.</p>
            {Object.entries(YEAR2_STREAMS).map(([stream, courses]) => (
              <div key={stream}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#28251D', marginBottom: '0.3rem', marginTop: '0.75rem' }}>{stream}</p>
                {courses.map(c => (
                  <button key={c.code} onClick={() => toggleCourse(c.code)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.6rem 0.75rem', marginBottom: '0.4rem', border: `1.5px solid ${selectedCourses.includes(c.code) ? '#01696F' : '#D4D1CA'}`, borderRadius: '0.5rem', background: selectedCourses.includes(c.code) ? '#01696F10' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${selectedCourses.includes(c.code) ? '#01696F' : '#D4D1CA'}`, background: selectedCourses.includes(c.code) ? '#01696F' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedCourses.includes(c.code) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#28251D' }}><strong>{c.code}</strong> — {c.name}</span>
                  </button>
                ))}
              </div>
            ))}

            {error && <p style={{ color: '#A13544', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            <button
              onClick={() => setStep('examdate')}
              disabled={selectedCourses.length === 0}
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: selectedCourses.length === 0 ? 0.6 : 1 }}
            >
              Continue ({selectedCourses.length} selected) →
            </button>
          </div>
        )}

        {/* Step: Exam date */}
        {step === 'examdate' && (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>When is your exam?</h1>
            <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>We'll use this to personalise your study plan and countdown.</p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#28251D', marginBottom: '0.4rem' }}>Exam date</label>
            <input
              type="date"
              value={examDate}
              min="2026-01-01"
              onChange={e => setExamDate(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #D4D1CA', borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#01696F10', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#01696F' }}>
              IGNOU June TEE typically starts around June 1, 2026
            </div>
            {error && <p style={{ color: '#A13544', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
            <button
              onClick={saveProfile}
              disabled={loading}
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Setting up your account…' : 'Start studying →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
