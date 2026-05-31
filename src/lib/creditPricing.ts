export const CREDIT_PRICE_INR = 49;
export const SUBJECT_UNLOCK_VALIDITY_MONTHS = 6;

export const CREDIT_OFFERS = {
  'buy-1-credit': {
    credits: 1,
    unlocksLabel: 'Build balance',
  },
  'buy-2-credits': {
    credits: 2,
    unlocksLabel: 'Unlock 1 subject',
  },
  'buy-4-credits': {
    credits: 4,
    unlocksLabel: 'Unlock 2 subjects',
  },
  'buy-5-credits': {
    credits: 5,
    unlocksLabel: 'Unlock 3 subjects',
  },
} as const;

export type CreditOfferId = keyof typeof CREDIT_OFFERS;

export function creditOfferAmountPaise(offerId: CreditOfferId) {
  return CREDIT_OFFERS[offerId].credits * CREDIT_PRICE_INR * 100;
}

export function creditOfferLabel(offerId: CreditOfferId) {
  const offer = CREDIT_OFFERS[offerId];
  return `Buy ${offer.credits} Topper Credit${offer.credits > 1 ? 's' : ''} (INR ${offer.credits * CREDIT_PRICE_INR})`;
}

export function creditsRequiredForSubjectUnlock({
  unlockedCount,
  isVerified,
}: {
  unlockedCount: number;
  isVerified: boolean;
}) {
  if (unlockedCount === 0 && isVerified) return 1;
  if (unlockedCount >= 2) return 1;
  return 2;
}

export function subjectUnlockExpiresAt(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + SUBJECT_UNLOCK_VALIDITY_MONTHS);
  return expiresAt.toISOString();
}
