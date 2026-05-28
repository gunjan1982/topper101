'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';

type BillingCycle = 'monthly' | 'semester';

type RazorpayFailureResponse = {
  error?: {
    code?: string;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const getOffers = (isYear1: boolean) => ({
  monthly: {
    label: 'TEE Jun 2026',
    sublabel: `Access until ${isYear1 ? '31 July 2026' : '30 June 2026'}`,
    expiryNote: isYear1 ? 'Covers the upcoming July TEE sitting' : 'Covers the upcoming June TEE sitting',
    subject1: { id: 'pass-1-subject-monthly', price: 99 },
    subject5: { id: 'pass-5-subjects-monthly', price: 299 },
  },
  semester: {
    label: 'Full Semester',
    sublabel: `Access until ${isYear1 ? '31 January 2027' : '31 December 2026'}`,
    expiryNote: isYear1 ? 'Covers both July and January TEE sittings' : 'Covers both June and December TEE sittings',
    subject1: { id: 'pass-1-subject-semester', price: 199 },
    subject5: { id: 'pass-5-subjects-semester', price: 499 },
  },
});

export default function PricingPage() {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [userYear, setUserYear] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserYear() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('year')
            .eq('id', user.id)
            .single();
          if (data?.year) {
            setUserYear(data.year);
          }
        }
      } catch (err) {
        console.error('Failed to load user year details:', err);
      }
    }
    loadUserYear();
  }, []);

  const isYear1 = userYear === 1;
  const offer = getOffers(isYear1)[billing];

  const handleUpgrade = async (offerId: string) => {
    setLoading(offerId);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Payment order creation failed');
      }
      const { orderId, amount, currency } = await res.json();

      const options: Record<string, unknown> = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Topper101',
        description: `Topper Pass — ${offer.sublabel}`,
        order_id: orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setLoading(offerId);
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              const errData = await verifyRes.json();
              throw new Error(errData.error || 'Verification failed');
            }
            router.push('/dashboard?payment=success');
          } catch (err: unknown) {
            console.error('Payment verification failed:', err);
            const errMsg = err instanceof Error ? err.message : 'Verification failed';
            setError(`Payment verification failed: ${errMsg}`);
          } finally {
            setLoading(null);
          }
        },
        modal: {
          ondismiss: function () {
            posthog?.capture('payment_failed', {
              error_type: 'dismissed',
              plan_tier: 'pass',
              offer_id: offerId,
              billing_cycle: billing,
            });
            setLoading(null);
          },
        },
        prefill: { name: '', email: '' },
        theme: { color: '#0f766e' },
      };

      if (!window.Razorpay) throw new Error('Razorpay checkout failed to load. Please verify your internet connection or disable ad-blockers.');

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: RazorpayFailureResponse) {
        const failCode = response?.error?.code || 'unknown';
        setError(`Payment failed: ${failCode}`);
        posthog?.capture('payment_failed', {
          error_type: failCode,
          plan_tier: 'pass',
          offer_id: offerId,
          billing_cycle: billing,
        });
      });
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Payment order creation failed';
      setError(errMsg);
      posthog?.capture('payment_failed', {
        error_type: 'order_creation_failed',
        plan_tier: 'pass',
        offer_id: offerId,
        billing_cycle: billing,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-16 relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative flex flex-col items-center p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="absolute -inset-4 rounded-full bg-teal-500/10 blur-xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 shadow-lg mb-4">
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Secure Checkout</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse text-center">
              Initializing payment gateway...
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-base font-semibold leading-7 text-teal-700">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Your first paper is free.
          </p>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
            Unlock more subjects when you&apos;re ready. Access expires at the TEE — not a rolling subscription.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mt-6 mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-center animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm font-bold text-red-800 dark:text-red-300 text-left">
                  ⚠️ Checkout Error: {error}
                </p>
                <button 
                  onClick={() => setError(null)}
                  className="rounded-full bg-red-100 dark:bg-red-950 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 dark:text-red-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Billing toggle */}
        <div className="mt-10 flex justify-center">
          <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                billing === 'monthly'
                  ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              TEE Jun 2026
              <span className="ml-1.5 text-xs font-normal opacity-70">until {isYear1 ? '31 Jul' : '30 Jun'}</span>
            </button>
            <button
              onClick={() => setBilling('semester')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                billing === 'semester'
                  ? 'bg-white text-zinc-900 shadow dark:bg-zinc-700 dark:text-zinc-50'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Full Semester
              <span className="ml-1.5 text-xs font-normal opacity-70">until {isYear1 ? '31 Jan 2027' : '31 Dec'}</span>
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {offer.expiryNote}
        </p>

        {/* Pricing cards */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* 1 Subject */}
          <div className="flex flex-col rounded-3xl bg-white p-8 ring-1 ring-zinc-200 xl:p-10 dark:bg-zinc-900 dark:ring-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">1 Subject</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              One theory paper of your choice
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
                ₹{offer.subject1.price}
              </span>
              <span className="text-sm text-zinc-500">one-time</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li>✓ Full 10-year question bank</li>
              <li>✓ Unlimited Textbook word count specific curated answers powered by AI</li>
              <li>✓ Frequency heat map</li>
              <li>✓ Progress tracking</li>
            </ul>
            <button
              onClick={() => handleUpgrade(offer.subject1.id)}
              disabled={!!loading}
              className="mt-8 rounded-xl bg-teal-700 px-6 py-3.5 text-center text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {loading === offer.subject1.id ? 'Initialising…' : `Unlock 1 subject — ₹${offer.subject1.price}`}
            </button>
          </div>

          {/* 5 Subjects */}
          <div className="flex flex-col rounded-3xl bg-teal-700 p-8 text-white xl:p-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">5 Subjects</h3>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                Best value
              </span>
            </div>
            <p className="mt-2 text-sm text-teal-100">
              Unlock up to 5 theory papers at once
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₹{offer.subject5.price}</span>
              <span className="text-sm text-teal-200">one-time</span>
            </div>
            <p className="mt-1 text-xs text-teal-200">
              ₹{Math.round(offer.subject5.price / 5)} per subject
            </p>
            <ul className="mt-6 space-y-2 text-sm text-teal-50">
              <li>✓ Full 10-year question bank</li>
              <li>✓ Unlimited Textbook word count specific curated answers powered by AI</li>
              <li>✓ Frequency heat map</li>
              <li>✓ Progress tracking</li>
            </ul>
            <button
              onClick={() => handleUpgrade(offer.subject5.id)}
              disabled={!!loading}
              className="mt-8 rounded-xl bg-white px-6 py-3.5 text-center text-sm font-bold text-teal-700 hover:bg-zinc-100 disabled:opacity-50"
            >
              {loading === offer.subject5.id ? 'Initialising…' : `Unlock 5 subjects — ₹${offer.subject5.price}`}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Subjects are auto-selected from your enrolled papers. No subscription — pay once, access until the TEE date.
        </p>
      </div>
    </div>
  );
}
