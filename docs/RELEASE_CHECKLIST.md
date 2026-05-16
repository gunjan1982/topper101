# Release Checklist

Use this checklist before every production deploy.

## Required Checks

```bash
npm run env:sync
npm run env:check
npm run verify
```

`npm run verify` runs:

- flow guardrails
- TypeScript
- ESLint
- Playwright browser smoke tests
- production build

Do not deploy if any step fails.

`npm run env:check` must point at the populated Supabase project before data-backed smoke checks or audits. See `docs/ENVIRONMENT.md`.

## Flow Review

- Public preview CTAs stay on-page unless the copy clearly promises signup.
- Signup/login links preserve `next` when the user is trying to reach a protected page.
- Dashboard navigation links only to implemented routes.
- Protected routes are listed in `PROTECTED_ROUTE_PREFIXES`.
- New routes are added to `ROUTES` before being linked from UI.

## Code Health

- Replaced logic is removed in the same change.
- Shared route values come from `src/lib/routes.ts`.
- Shared MAPC stream values come from `src/lib/courseCatalog.ts`.
- Exact repeat-family and study-hook logic comes from `src/lib/questionRepeatAlgorithm.ts`.
- If repeat intelligence changes, run `npm run repeat:backfill -- --dry-run`, `npm run repeat:backfill`, and confirm `npm run repeat:backfill -- --only-missing --dry-run` reports `Rows needing update: 0`.
- Pricing and subject access must go through `src/lib/entitlements.ts`; do not scatter `plan_tier` checks into new UI or API code.
- No duplicate year/stream/course lists are introduced.
- Temporary fallback logic includes a comment explaining why it exists and when it can be removed.

## Production Smoke Check

After deployment, verify:

- `https://www.topper101.com` returns `200`.
- Landing page has `Explore the Concept Tree` linking to `#concept-tree`.
- Landing page has no stale `Unlock your study map` copy.
- `https://www.topper101.com/pricing` redirects to `/login?next=%2Fpricing` when logged out.
- Vercel deployment status is `Ready` and aliases include `topper101.com` and `www.topper101.com`.
