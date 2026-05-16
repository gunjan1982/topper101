# Environment And Secrets

This project uses Infisical as the source of truth for local secrets. Do not use `vercel env pull` to populate `.env.local` for audit or data work; Vercel may return empty quoted values for sensitive/encrypted variables.

## Required Setup

Run this before local development, Supabase audits, question-bank audits, seed scripts, or deployments that depend on local verification:

```bash
npm run env:sync
npm run env:check
```

`npm run env:sync` pulls from Infisical EU Cloud, `prod` environment, and writes `.env.local`.

`npm run env:check` verifies `.env.local` points at the populated Topper101 Supabase project.

Expected populated project today:

```text
Supabase project: gayauvhhgwbbqgrqajak.supabase.co
courses: 16
questions: 1614
topic_clusters: 246
```

Counts can increase as the question bank grows, but they should not be zero. If `courses`, `questions`, or `topic_clusters` are zero, the environment is not suitable for audits.

## Infisical Mapping

Infisical stores project-scoped names. The app expects standard Next.js/Supabase names.

| Infisical secret | Local `.env.local` key |
|---|---|
| `TOPPER101_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `TOPPER101_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `TOPPER101_SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |
| `TOPPER101_RAZORPAY_KEY_ID` | `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` |
| `TOPPER101_RAZORPAY_KEY_SECRET` | `RAZORPAY_KEY_SECRET` |
| `TOPPER101_RAZORPAY_WEBHOOK_SECRET` | `RAZORPAY_WEBHOOK_SECRET` |
| `TOPPER101_POSTHOG_KEY` | `NEXT_PUBLIC_POSTHOG_KEY` |
| `TOPPER101_POSTHOG_HOST` | `NEXT_PUBLIC_POSTHOG_HOST` |
| `TOPPER101_SITE_URL` | `NEXT_PUBLIC_SITE_URL` |
| `DEEPSEEK_API_KEY` | `DEEPSEEK_API_KEY` |

The mapping lives in `scripts/sync-env-from-infisical.mjs`.

## Audit Rules

- Run `npm run env:sync && npm run env:check` before DB-backed audits.
- Use `SUPABASE_SERVICE_ROLE_KEY` only in server scripts and local audit scripts.
- Never expose service-role keys in client code, logs, screenshots, or docs.
- Supabase queries used for full-table audits must paginate beyond the default 1000-row limit.
- Supabase pagination must use deterministic ordering, including a unique key such as `id`, before `.range(...)`.
- If an audit says `public.questions` is missing or all content tables are empty, fix environment alignment before trusting results.

## Question Intelligence Backfill

After changing `src/lib/questionRepeatAlgorithm.ts`, persist the new output to Supabase:

```bash
npm run env:check
npm run repeat:backfill -- --dry-run
npm run repeat:backfill
npm run repeat:backfill -- --only-missing --dry-run
```

The final dry run must report `Rows needing update: 0`. The backfill writes only derived repeat-intelligence columns; it does not change question text, answers, marks, sections, courses, or user progress.

## Common Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| `Could not find the table 'public.questions'` | `.env.local` points at the wrong Supabase project | Run `npm run env:sync`; verify Infisical `TOPPER101_SUPABASE_URL` |
| `courses=0, questions=0, topic_clusters=0` | Supabase is reachable but empty/wrong | Run `npm run env:sync`; check Infisical values |
| Empty strings after `vercel env pull` | Vercel did not materialize sensitive/encrypted values | Use Infisical sync instead |
| Only 1000 question rows returned | Supabase range default was not paginated | Use paginated `.range(from, to)` audit queries |
