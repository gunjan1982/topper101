'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

export default function PricingPage() {
  const posthog = usePostHog();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (planId: string, billingCycle: 'monthly' | 'semester') => {
    setLoading(`${planId}-${billingCycle}`);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ planId, billingCycle }),
      });
      const { orderId, amount, currency } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'Topper101',
        description: `Upgrade to ${planId}`,
        order_id: orderId,
        handler: function (response: any) {
          // Success — webhook handles DB update; just redirect
          router.push('/dashboard?payment=success');
        },
        modal: {
          ondismiss: function () {
            // User closed modal without paying
            posthog?.capture('payment_failed', {
              error_type: 'dismissed',
              plan_tier: planId,
            });
            setLoading(null);
          },
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        posthog?.capture('payment_failed', {
          error_type: response?.error?.code || 'unknown',
          plan_tier: planId,
        });
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      posthog?.capture('payment_failed', {
        error_type: 'order_creation_failed',
        plan_tier: planId,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-teal-700">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Topper Pass */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-zinc-200 xl:p-10 dark:bg-zinc-900 dark:ring-zinc-800">
            <div>
              <h3 className="text-lg font-semibold leading-8 text-zinc-900 dark:text-zinc-50">Topper Pass</h3>
              <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">Perfect for focused semester prep.</p>
              <div className="mt-6 flex flex-col gap-4">
                <button 
                  onClick={() => handleUpgrade('pass', 'monthly')}
                  disabled={!!loading}
                  className="rounded-xl bg-teal-700 px-6 py-4 text-center text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50"
                >
                  {loading === 'pass-monthly' ? 'Initialising...' : '₹299 / Month'}
                </button>
                <button 
                   onClick={() => handleUpgrade('pass', 'semester')}
                   disabled={!!loading}
                   className="rounded-xl border border-teal-700 px-6 py-4 text-center text-sm font-bold text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/10 disabled:opacity-50"
                >
                  {loading === 'pass-semester' ? 'Initialising...' : '₹799 / Semester (Save 50%)'}
                </button>
              </div>
            </div>
          </div>

          {/* Topper Pro */}
          <div className="flex flex-col justify-between rounded-3xl bg-teal-700 p-8 text-white xl:p-10">
            <div>
              <h3 className="text-lg font-semibold leading-8">Topper Pro</h3>
              <p className="mt-4 text-sm leading-6 opacity-80">Full suite for dedicated MAPC students.</p>
              <div className="mt-6 flex flex-col gap-4">
                <button 
                  onClick={() => handleUpgrade('pro', 'monthly')}
                  disabled={!!loading}
                  className="rounded-xl bg-white px-6 py-4 text-center text-sm font-bold text-teal-700 hover:bg-zinc-100 disabled:opacity-50"
                >
                  {loading === 'pro-monthly' ? 'Initialising...' : '₹499 / Month'}
                </button>
                <button 
                   onClick={() => handleUpgrade('pro', 'semester')}
                   disabled={!!loading}
                   className="rounded-xl border border-white px-6 py-4 text-center text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {loading === 'pro-semester' ? 'Initialising...' : '₹1,299 / Semester'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
