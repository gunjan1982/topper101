'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(
    searchParams.get('step') === 'courses' ? 'courses' : 'email'
  );
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [teeSession, setTeeSession] = useState('TEE-Jun-2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInAsTestUser() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@topper101.com',
      password: 'test123',
    });
    if (error) { setError(error.message); setLoading(false); return; }
    // Check if profile exists
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('user_profiles').select('id').eq('id', user.id).single();
      if (!profile) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          email: 'test@topper101.com',
          enrolled_courses: ['MPC-001', 'MPC-002', 'MPC-003', 'MPC-004', 'MPCE-11', 'MPCE-21', 'MPCE-23'],
          exam_date: '2026-06-01',
          subscription_tier: 'free',
        });
      }
    }
    router.push('/dashboard');
    setLoading(false);
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/check-profile`,
      },
    });
    if (error) { setError(error.message); setLoading(false); }
    // Browser redirects — no further code runs
  }

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
      exam_date: teeSession === 'TEE-Jun-2026' ? '2026-06-01' : teeSession === 'TEE-Dec-2026' ? '2026-12-01' : '2027-06-01',
      subscription_tier: 'free',
    });

    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard');
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
            <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sign in to access your personalised question bank.</p>

            {/* Google button */}
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem', background: 'white', color: '#28251D', border: '1.5px solid #D4D1CA', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#D4D1CA' }} />
              <span style={{ fontSize: '0.8rem', color: '#7A7974' }}>or use email</span>
              <div style={{ flex: 1, height: '1px', background: '#D4D1CA' }} />
            </div>

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
              style={{ marginTop: '0.75rem', width: '100%', padding: '0.85rem', background: '#01696F', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', opacity: loading || !email ? 0.6 : 1 }}
            >
              {loading ? 'Sending…' : 'Send code →'}
            </button>

            {/* Dev shortcut — remove before public launch */}
            <button
              onClick={signInAsTestUser}
              disabled={loading}
              style={{ marginTop: '1.5rem', width: '100%', padding: '0.6rem', background: 'none', border: '1px dashed #D4D1CA', borderRadius: '0.5rem', fontSize: '0.78rem', color: '#7A7974', cursor: 'pointer' }}
            >
              🛠 Dev: sign in as test user
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

        {/* Step: TEE session */}
        {step === 'examdate' && (
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Which TEE are you preparing for?</h1>
            <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>IGNOU holds Term End Exams twice a year — June and December.</p>

            {[
              { value: 'TEE-Jun-2026', label: 'TEE June 2026', sub: 'Exams typically start June 1, 2026', date: '2026-06-01' },
              { value: 'TEE-Dec-2026', label: 'TEE December 2026', sub: 'Exams typically start December 1, 2026', date: '2026-12-01' },
              { value: 'TEE-Jun-2027', label: 'TEE June 2027', sub: 'Exams typically start June 1, 2027', date: '2027-06-01' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setTeeSession(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.85rem 1rem', marginBottom: '0.6rem', border: `1.5px solid ${teeSession === opt.value ? '#01696F' : '#D4D1CA'}`, borderRadius: '0.5rem', background: teeSession === opt.value ? '#01696F08' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${teeSession === opt.value ? '#01696F' : '#D4D1CA'}`, background: teeSession === opt.value ? '#01696F' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {teeSession === opt.value && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white', display: 'block' }} />}
                </span>
                <span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#28251D', display: 'block' }}>{opt.label}</span>
                  <span style={{ fontSize: '0.8rem', color: '#7A7974' }}>{opt.sub}</span>
                </span>
              </button>
            ))}

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
