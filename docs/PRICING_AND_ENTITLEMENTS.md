# Pricing And Entitlements

Topper101 should earn trust before asking students to pay.

## Current Offer

- Public users can preview concept maps and heat maps.
- New signed-in users get one full subject unlocked for free.
- The free subject is selected from the user's chosen papers by upcoming exam order.
- Pass users can buy monthly subject unlocks: Rs 99 for 1 subject or Rs 299 for up to 5 subjects.
- Referral rewards can unlock additional subjects.

## Entitlement Model

Do not encode pricing access directly in UI components.

Access is based on:

- `users.plan_tier`
- `user_entitlements`
- central helpers in `src/lib/entitlements.ts`

Main table:

```text
user_entitlements
```

Important fields:

- `entitlement_type`: currently `subject_unlock` or `answer_credit`
- `course_code`: subject/paper being unlocked
- `source`: `signup_free`, `referral`, `purchase`, or `admin`
- `expires_at`: optional expiry

Referral table:

```text
referrals
```

Referral rewards are capped by `REFERRAL_REWARD_LIMIT` in `src/lib/entitlements.ts`.

## Access Rules

- Users can access papers where they have an active `subject_unlock`.
- Purchase unlocks are monthly and use `source = purchase`.
- Answer access must call the central entitlement helper.
- Pages may preview locked papers, but answer access must be enforced server-side.

## Backfill

Existing onboarded users can be granted their first free paper with:

```bash
npm run entitlements:backfill-free -- --dry-run
npm run entitlements:backfill-free
```

This writes only `signup_free` subject unlocks and does not modify user progress, answers, or selected papers.

## Product Positioning

Use this framing:

```text
Your first paper is free. Upgrade when Topper101 has earned your trust.
```

Avoid sounding like a cheap solved-paper shop. Topper101 sells evidence, structure, probability, and calm exam strategy.
