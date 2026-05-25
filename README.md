# Topper101

Topper101 is a Next.js app for IGNOU MAPC exam prep. The app helps students pick their year, stream, and papers, then study high-yield question banks, AI answers, and assignments.

**Live site: https://topper101.com** (deployed on Vercel, custom domain via Namecheap)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Check that local secrets point at the expected Supabase project:

```bash
npm run env:sync
npm run env:check
```

Secrets live in Infisical EU Cloud under the `prod` environment. The app expects standard Next.js/Supabase env names, while Infisical stores project-scoped names such as `TOPPER101_SUPABASE_URL`; `npm run env:sync` maps those into `.env.local`.

If `npm run env:check` fails with empty tables or `Could not find the table public.questions`, `.env.local` is pointing at the wrong Supabase project or Infisical has stale Supabase values. Do not rely on `vercel env pull` for sensitive/encrypted Supabase values; Vercel may return empty quoted values for those.

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the Infisical mapping, expected Supabase project, and audit rules.

Before shipping changes, run:

```bash
npm run verify
```

## Product Flow

1. Public landing page previews the Concept Tree and sends new users to signup with an explicit `next` destination.
2. Signup/login preserves `next`. Google OAuth is shown only when `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and the Supabase provider is enabled.
3. Authenticated users land on `/dashboard`.
4. If onboarding is incomplete, `/dashboard` redirects to `/onboarding/year`, then stream selection for Year 2, then paper selection.
5. Paper selection completes onboarding and returns the user to `/dashboard`.
6. Dashboard cards link directly to implemented course pages. The header must not link to routes that do not exist.

## Project Map

See [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md) for the route/file ownership map, [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for secrets and Supabase alignment, and [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) for the deploy checklist.

## Maintenance Rules

- Keep one active code path for each user flow. When replacing a flow, remove the old links, redirects, helpers, and copy in the same change.
- Public CTAs must either stay on the public page with anchors or carry an explicit `next` destination through `/signup` or `/login`.
- Protected routes should rely on middleware to send unauthenticated users to `/login?next=...`.
- Do not add dashboard navigation to routes until the route exists and has been verified.
- Prefer shared helpers for repeated navigation rules. `src/lib/navigation.ts` owns safe redirect destinations.
- Avoid code bloat: do not add parallel components, duplicate catalog data, or fallback logic unless there is a documented reason and a removal condition.

## Automated Guardrails

`npm run guardrails` checks for common flow traps before builds and deployments:

- bare `/signup` links on the public landing page
- preview CTAs that no longer stay on-page
- dashboard navigation to missing routes
- internal static links that point to unimplemented pages
- protected routes missing from middleware
- missing CI or Playwright verification setup

`npm run build` runs these guardrails first through `prebuild`.

CI runs `npm run verify` from `.github/workflows/verify.yml`.
