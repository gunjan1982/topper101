<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Topper101 Project Guidelines

Read `README.md`, `docs/PROJECT_MAP.md`, and `docs/ENVIRONMENT.md` before changing route, auth, onboarding, dashboard, pricing, course behavior, Supabase data, or audit scripts.

## Environment First

- Secrets live in Infisical EU Cloud `prod`, not in Vercel env pulls.
- Before DB-backed audits or seed/data work, run `npm run env:sync` and `npm run env:check`.
- The populated Supabase project should report nonzero `courses`, `questions`, and `topic_clusters`.
- Do not trust audits run against an empty Supabase project or against `vercel env pull` output with empty quoted values.
- Full question-bank audits must paginate Supabase queries beyond the default 1000-row response limit.

## Flow Ownership

- `src/middleware.ts` owns route protection.
- `src/lib/routes.ts` owns route constants, protected route prefixes, auth route prefixes, and dashboard nav links.
- `src/lib/navigation.ts` owns safe `next` destinations and signup/login CTA redirect URLs.
- `src/app/page.tsx` owns public marketing and previews.
- `src/app/(auth)` owns login/signup/reset-password UI and auth actions.
- `src/app/onboarding` owns year, stream, and paper selection.
- `src/app/(dashboard)` owns authenticated dashboard, pricing, settings, course pages, and assignments.

## No Stale Paths

- Do not keep old routes, old CTAs, or old redirect logic after changing a flow.
- Search with `rg` for route strings and CTA copy before finishing any flow change.
- Dashboard navigation may only link to implemented, verified routes.
- Preview CTAs must remain on-page unless the visible copy clearly promises signup/login.
- Auth CTAs must preserve intent with `withRedirectTo('/signup', '/target')` or `withRedirectTo('/login', '/target')`.

## No Code Bloat

- Prefer one shared helper over repeating route logic.
- Do not add a second component or fallback path that does the same job as an existing one.
- Do not hardcode exam dates, course names, or CTA redirect rules inside route files when a shared `src/lib/*` source already exists.
- If a temporary fallback is necessary, document why it exists and when it can be removed.
- Remove replaced code in the same change that introduces the replacement.

## Verification

Run these before shipping:

```bash
npm run verify
```

`npm run build` runs `npm run guardrails` first. If guardrails fail, fix the stale route, CTA, or redirect instead of bypassing the check.

Before production deploys, follow `docs/RELEASE_CHECKLIST.md`.
