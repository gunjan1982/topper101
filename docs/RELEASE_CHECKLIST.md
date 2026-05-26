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

## Vercel Deployment

**Always deploy via GitHub push** (`git push origin main`). Do NOT run `vercel --prod` from the local machine — the `data/` directory (1.2 GB of PDFs and JSON) will be uploaded and hit Vercel's 100 MB file size limit, corrupting the deployment.

Vercel project: `topper101` under team `gunjan-aggarwals-projects-f7b4752d`.

### `.vercelignore` rules

The `.vercelignore` at the workspace root excludes large data files. **Do not add `scripts/` to `.vercelignore`** — the `prebuild` npm script runs `scripts/check-flow-guardrails.mjs` and `scripts/check-repeat-algorithm.mjs`. Excluding `scripts/` causes a pre-build crash (`Cannot find module '/vercel/path0/scripts/check-flow-guardrails.mjs'`) that fails the deployment in under 10 seconds with `[0ms]` build time.

Only these script paths are safe to ignore:
```
scripts/upload_pdfs_to_supabase.py
scripts/pipeline/
```

### Feature flags via env vars

| Feature | Env var | Current value |
|---------|---------|---------------|
| Google OAuth on login | `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | `true` (Production) |

Feature flags are set in Vercel Dashboard → Project → Settings → Environment Variables.

### Diagnosing a failed deploy

If GitHub-triggered deploys fail fast (< 30s), get the actual error:
```bash
# Get deployment ID from GitHub status
curl -s "https://api.github.com/repos/gunjan1982/topper101/deployments?per_page=1" | python3 -m json.tool
# Then inspect logs:
npx vercel inspect <dpl_id> --logs 2>&1 | head -60
```

## Production Smoke Check

After deployment, verify:

- `https://www.topper101.com` returns `200`.
- Landing page has `Explore the Concept Tree` linking to `#concept-tree`.
- Landing page has no stale `Unlock your study map` copy.
- `https://www.topper101.com/pricing` redirects to `/login?next=%2Fpricing` when logged out.
- Vercel deployment status is `Ready` and aliases include `topper101.com` and `www.topper101.com`.
