'use client';

import { useState } from 'react';

interface CopyReferralLinkProps {
  referralCode: string;
  siteUrl: string;
  signupPath: string;
}

export default function CopyReferralLink({ referralCode, siteUrl, signupPath }: CopyReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const referralUrl = `${siteUrl}${signupPath}?ref=${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="truncate rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-teal-50 max-w-xs">
        {referralUrl}
      </span>
      <button
        onClick={handleCopy}
        className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/30 active:scale-95 whitespace-nowrap"
      >
        {copied ? '✓ Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
