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

export default function QuestionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding'); return; }
      setUserEmail(user.email ?? '');

      const { data } = await supabase
        .from('questions')
        .select('id, question_text, question_type, marks, frequency_tag, last_appeared, courses(code, name)')
        .eq('is_published', true)
        .order('frequency_tag', { ascending: true })
        .limit(20);

      setQuestions((data as unknown as Question[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const freqColor: Record<string, string> = {
    high: '#A13544',
    medium: '#964219',
    low: '#7A7974',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>
      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #D4D1CA', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#01696F', textDecoration: 'none' }}>Topper101</a>
        <span style={{ fontSize: '0.85rem', color: '#7A7974' }}>{userEmail}</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#28251D', marginBottom: '0.25rem' }}>Question Bank</h1>
        <p style={{ color: '#7A7974', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Sorted by exam frequency — highest probability first.</p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#7A7974' }}>Loading questions…</div>
        )}

        {!loading && questions.length === 0 && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', border: '1px solid #D4D1CA' }}>
            <p style={{ color: '#28251D', fontWeight: 600, marginBottom: '0.5rem' }}>Questions coming soon</p>
            <p style={{ color: '#7A7974', fontSize: '0.9rem' }}>We're loading past paper questions into the database. Check back shortly.</p>
          </div>
        )}

        {questions.map(q => (
          <div key={q.id} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '0.75rem', border: '1px solid #D4D1CA', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A7974', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {q.courses?.code ?? 'MAPC'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#D4D1CA' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#7A7974' }}>{q.marks} Marks</span>
              {q.frequency_tag && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: freqColor[q.frequency_tag] ?? '#7A7974', background: `${freqColor[q.frequency_tag]}15`, padding: '0.2rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {q.frequency_tag} frequency
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
