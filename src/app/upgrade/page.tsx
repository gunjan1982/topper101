'use client';
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'exam_pass',
    name: 'Exam Pass',
    price: '₹499',
    period: 'per TEE session',
    badge: 'Most Popular',
    color: '#01696F',
    features: [
      'Full question bank — all subjects',
      'AI model answers for every question',
      'Sorted by exam probability',
      'Valid for one TEE session (6 months)',
    ],
  },
  {
    id: 'full_archive',
    name: 'Full Archive',
    price: '₹799',
    period: 'lifetime access',
    badge: 'Best Value',
    color: '#0C4E54',
    features: [
      'Everything in Exam Pass',
      'Complete 10-year question archive',
      'New questions as we add them',
      'Lifetime access — pay once',
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #D4D1CA', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/" style={{ fontWeight: 800, fontSize: '1.1rem', color: '#01696F', textDecoration: 'none' }}>Topper101</a>
          <span style={{ color: '#D4D1CA', margin: '0 0.25rem' }}>|</span>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#01696F', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
          >
            MAPC
          </button>
          <span style={{ color: '#D4D1CA', fontSize: '0.9rem' }}>›</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#28251D' }}>Upgrade</span>
        </div>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#28251D', marginBottom: '0.5rem' }}>
            Unlock your full question bank
          </h1>
          <p style={{ color: '#7A7974', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto' }}>
            Every past paper question, sorted by exam probability. Study smarter for your TEE.
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: `2px solid ${plan.color}`, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* Badge */}
              <span style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', background: plan.color, color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                {plan.badge}
              </span>

              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{plan.name}</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#28251D', marginBottom: '0.1rem' }}>{plan.price}</p>
              <p style={{ fontSize: '0.8rem', color: '#7A7974', marginBottom: '1.25rem' }}>{plan.period}</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#28251D' }}>
                    <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                style={{ width: '100%', padding: '0.85rem', background: plan.color, color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'not-allowed', opacity: 0.7 }}
                disabled
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>

        {/* Free tier reminder */}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', border: '1px solid #D4D1CA', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#7A7974' }}>
            Already on the free plan? Your first subject remains fully unlocked — no action needed.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#01696F', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            ← Back to dashboard
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#7A7974', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          Payments via Razorpay · Secure checkout · UPI, cards, net banking accepted
        </p>
      </div>
    </div>
  );
}
