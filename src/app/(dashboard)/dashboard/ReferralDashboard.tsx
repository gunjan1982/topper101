'use client';

import { useState } from 'react';

interface Referral {
  status: string;
  created_at: string;
}

interface ReferralDashboardProps {
  referralCode: string;
  referrals: Referral[];
  siteUrl: string;
}

export default function ReferralDashboard({ referralCode, referrals = [], siteUrl }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${siteUrl}/signup?ref=${referralCode}`;
  
  const rewardedCount = referrals.filter(
    (r) => r.status === 'rewarded' || r.status === 'qualified'
  ).length;

  const rewardLimit = 3;
  const progressPercent = Math.min((rewardedCount / rewardLimit) * 100, 100);

  const shareText = `Hey! I'm using Topper101 to study for my IGNOU MAPC exams. It has topic frequency heatmaps, repeat question families, and textbook-cited answers. Sign up using my link to get a subject unlocked for free! 🚀`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n\n' + referralUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* Left column: Info & Progress */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight dark:text-white">Refer & Unlock</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Invite your classmates to Topper101. When they complete onboarding, you get a full subject unlock for free.
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Rewards earned: {rewardedCount} of {rewardLimit}
              </span>
              <span className="text-xs text-zinc-500">
                {rewardLimit - rewardedCount} slots left
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>0 Unlocks</span>
              <span>1 Unlock</span>
              <span>2 Unlocks</span>
              <span>3 Unlocks (Max)</span>
            </div>
          </div>
        </div>

        {/* Right column: Action code copy */}
        <div className="w-full md:w-80 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/80 border border-zinc-100 dark:border-zinc-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Your referral code
          </label>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 pl-2">
              {referralCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-teal-600 active:scale-95 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Social share */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2 px-3 text-xs font-bold text-white transition-all hover:bg-[#20ba59] active:scale-95"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.557 1.874 14.08 .842 11.447.841 6.009.841 1.585 5.265 1.582 10.7c-.001 1.716.453 3.39 1.314 4.873l-.972 3.548 3.636-.953c1.472.802 3.125 1.222 4.797 1.222zm11.303-7.794c-.3-.149-1.774-.875-2.046-.975-.27-.1-.469-.149-.667.149-.198.299-.769.976-.943 1.176-.173.199-.347.224-.647.075-.3-.15-1.266-.466-2.41-1.487-.89-.794-1.492-1.775-1.667-2.074-.173-.3-.018-.462.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.667-1.605-.914-2.197-.24-.579-.48-.5-.667-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.299-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.774-.726 2.022-1.429.247-.702.247-1.303.173-1.429-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0088cc] py-2 px-3 text-xs font-bold text-white transition-all hover:bg-[#0077b3] active:scale-95"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 4-1.74 6.67-2.88 8-3.42 3.81-1.55 4.6-1.82 5.12-1.83.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z"/>
              </svg>
              Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Referrals history list */}
      {referrals.length > 0 && (
        <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Referrals History
          </h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {referrals.map((referral, index) => {
                const dateStr = new Date(referral.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                
                const isRewarded = referral.status === 'rewarded' || referral.status === 'qualified';
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800">
                        <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Classmate {index + 1}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Joined on {dateStr}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isRewarded ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Reward Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          Pending Onboarding
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
