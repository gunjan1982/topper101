'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

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

const OFFERS: Record<BillingCycle, {
  label: string;
  sublabel: string;
  expiryNote: string;
  subject1: { id: string; price: number };
  subject5: { id: string; price: number };
}> = {
  monthly: {
    label: 'TEE Jun 2026',
    sublabel: 'Access until 30 June 2026',
    expiryNote: 'Covers the upcoming June TEE sitting',
    subject1: { id: 'pass-1-subject-monthly', price: 99 },
    subject5: { id: 'pass-5-subjects-monthly', price: 299 },
  },
  semester: {
    label: 'Full Semester',
    sublabel: 'Access until 31 December 2026',
    expiryNote: 'Covers both June and December TEE sittings',
    subject1: { id: 'pass-1-subject-semester', price: 199 },
    subject5: { id: 'pass-5-subjects-semester', price: 499 },
  },
};

export default function PricingPage() {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const router = useRouter();
  const offer = OFFERS[billing];

  const handleUpgrade = async (offerId: string) => {
    setLoading(offerId);
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
        handler: function () {
          router.push('/dashboard?payment=success');
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

      if (!window.Razorpay) throw new Error('Razorpay checkout failed to load');

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: RazorpayFailureResponse) {
        posthog?.capture('payment_failed', {
          error_type: response?.error?.code || 'unknown',
          plan_tier: 'pass',
          offer_id: offerId,
          billing_cycle: billing,
        });
      });
      rzp.open();
    } catch (error) {
      console.error(error);
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
    <div className="py-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

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
              <span className="ml-1.5 text-xs font-normal opacity-70">until 30 Jun</span>
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
              <span className="ml-1.5 text-xs font-normal opacity-70">until 31 Dec</span>
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
              <li>✓ Unlimited AI answer views</li>
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
              <li>✓ Unlimited AI answer views</li>
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
