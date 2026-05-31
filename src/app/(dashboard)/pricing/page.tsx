'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';
import { CREDIT_OFFERS, CREDIT_PRICE_INR, SUBJECT_UNLOCK_VALIDITY_MONTHS, creditOfferAmountPaise, type CreditOfferId } from '@/lib/creditPricing';

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

const creditCards = (Object.keys(CREDIT_OFFERS) as CreditOfferId[]).map((id) => ({
  id,
  ...CREDIT_OFFERS[id],
  price: creditOfferAmountPaise(id) / 100,
}));

export default function PricingPage() {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  useEffect(() => {
    async function loadUserDetails() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
        }
      } catch (err) {
        console.error('Failed to load user details:', err);
      }
    }
    loadUserDetails();
  }, []);

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
        description: 'Topper Credits',
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
            router.refresh();
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
              offer_id: offerId,
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
          offer_id: offerId,
        });
      });
      rzp.open();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Payment order creation failed';
      setError(errMsg);
      posthog?.capture('payment_failed', {
        error_type: 'order_creation_failed',
        offer_id: offerId,
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
            Buy credits. Unlock subjects.
          </p>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
            Credits are ₹{CREDIT_PRICE_INR} each. 2 credits buy 1 subject, and every credit-based subject unlock is valid for {SUBJECT_UNLOCK_VALIDITY_MONTHS} months.
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

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-4">
          {creditCards.map((card) => (
            <div
              key={card.id}
              className={`flex flex-col rounded-2xl p-6 ring-1 ${
                card.id === 'buy-5-credits'
                  ? 'bg-teal-700 text-white ring-teal-700'
                  : 'bg-white text-zinc-950 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  {card.credits} Credit{card.credits > 1 ? 's' : ''}
                </h3>
                {card.id === 'buy-5-credits' && (
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">Best value</span>
                )}
              </div>
              <p className={`mt-2 text-sm ${card.id === 'buy-5-credits' ? 'text-teal-50' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {card.unlocksLabel}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹{card.price}</span>
                <span className={`text-sm ${card.id === 'buy-5-credits' ? 'text-teal-100' : 'text-zinc-500'}`}>one-time</span>
              </div>
              <p className={`mt-1 text-xs ${card.id === 'buy-5-credits' ? 'text-teal-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                ₹{CREDIT_PRICE_INR} per credit
              </p>
              <button
                onClick={() => handleUpgrade(card.id)}
                disabled={!!loading}
                className={`mt-8 rounded-xl px-4 py-3 text-center text-sm font-bold disabled:opacity-50 ${
                  card.id === 'buy-5-credits'
                    ? 'bg-white text-teal-700 hover:bg-zinc-100'
                    : 'bg-teal-700 text-white hover:bg-teal-600'
                }`}
              >
                {loading === card.id ? 'Initialising…' : `Buy ${card.credits} credit${card.credits > 1 ? 's' : ''}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
          <div className="font-bold text-zinc-900 dark:text-zinc-50">Credit redemption policy</div>
          <p className="mt-2">
            2 credits unlock 1 subject for {SUBJECT_UNLOCK_VALIDITY_MONTHS} months. 4 credits unlock 2 subjects, and 5 credits unlock 3 subjects. Uploading an Admit Card gives 1 credit toward your first free subject.
          </p>
        </div>

        {/* Dev Testing Card */}
        {isDev && (
          <div className="mt-8 rounded-2xl border border-dashed border-teal-500/40 bg-teal-500/5 p-6 text-center animate-fade-in">
            <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400">🛠️ Developer Payment Testing</h4>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Run a live integration check with a Re 1 charge. This card is only visible in local development.
            </p>
            <button
              onClick={() => handleUpgrade('pass-testing')}
              disabled={!!loading}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {loading === 'pass-testing' ? 'Initialising…' : 'Test Checkout — ₹1'}
            </button>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Credits are added immediately after successful Razorpay verification. Subject unlocks are redeemed inside the subject page.
        </p>
      </div>
    </div>
  );
}
