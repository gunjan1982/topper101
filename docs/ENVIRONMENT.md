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
Supabase project: gayauvhhgwbbqgrqajak.supabase.co (Singapore)
courses: 16
questions: 2129  # updated May 2026 after Dec 2025 papers seeded
topic_clusters: 246
```

Counts can increase as the question bank grows, but they should not be zero. If `courses`, `questions`, or `topic_clusters` are zero, the environment is not suitable for audits.

## Live Domain

Production site: **https://topper101.com** (custom domain, DNS via Namecheap, deployed on Vercel under team `gunjan-aggarwals-projects-f7b4752d`).

Vercel also serves the project at `topper101.vercel.app`. The canonical URL for all links and Supabase auth redirects is `https://topper101.com`.

## DNS Configuration (Namecheap)

Nameservers: `dns1.registrar-servers.com`, `dns2.registrar-servers.com`

Required records in Namecheap → Advanced DNS for `topper101.com`:

| Type | Host | Value |
|------|------|-------|
| A Record | `@` | `76.76.21.21` |
| CNAME Record | `www` | `cname.vercel-dns.com.` |
| TXT Record | `_vercel` | `vc-domain-verify=topper101.com,364daf345dc33ef72775` |
| TXT Record | `_vercel` | `vc-domain-verify=www.topper101.com,8842f04e06d03d54aff1` |

**Two TXT records at the same `_vercel` host are required** — one to verify the apex domain and one to verify `www`. Namecheap supports multiple TXT values at the same host.

### DNS Pitfalls Learned (May 2026 — cost 1 day)

1. **Wrong TXT token**: The `_vercel` TXT record must use the token Vercel shows in Settings → Domains → Learn more for **this specific project/team**. Tokens are unique per (project × domain). An old token from a prior deployment will silently fail verification even if the format looks correct.

2. **Space in TXT value**: Namecheap's UI can introduce a space after the comma, e.g. `vc-domain-verify=topper101.com, 364daf…` instead of `vc-domain-verify=topper101.com,364daf…`. This causes Vercel verification to fail. Always verify the raw DNS value with:
   ```bash
   dig @dns1.registrar-servers.com _vercel.topper101.com TXT +noall +answer
   ```

3. **Domain linked to another Vercel account**: `topper101.com` was previously linked to a personal Vercel account. When used on the team project it shows "This domain is linked to another Vercel account" and requires the TXT record to prove cross-account ownership. After verification succeeds once, the TXT record can be removed — but keeping it is harmless.

4. **Vercel caches old DNS**: After fixing DNS, click **Refresh** in Vercel Settings → Domains. Vercel queries authoritative nameservers directly, so propagation to your local resolver is not required first. If Refresh keeps failing, query the authoritative nameserver to confirm the record is correct before assuming propagation delay.

5. **Old Vercel A-record IP**: Vercel may show `216.198.79.1` as the recommended A record (legacy infrastructure). The current correct IP is `76.76.21.21`. Both work — prefer `76.76.21.21`.

## Supabase Storage

Public bucket: `pdfs` in `gayauvhhgwbbqgrqajak.supabase.co`.

Public URL prefix: `https://gayauvhhgwbbqgrqajak.supabase.co/storage/v1/object/public/pdfs/`

Folder layout:

```text
pdfs/
  past-papers/{courseCode}/{courseCode}_{Session}_{Year}.pdf   # 184 files
  past-papers-dec2025/{courseCode}.pdf                          # 16 files, Dec 2025
```

The Q-paper API route (`/api/pdf/qpaper/[courseCode]`) redirects to these public URLs in production. Textbooks are NOT uploaded (too large — up to 421 MB); the course page shows inline chunk text instead.

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
| `topper101.com` Verification Needed after clicking Refresh | Wrong TXT token or space in value | See DNS Pitfalls section above; check raw value with `dig @dns1.registrar-servers.com _vercel.topper101.com TXT` |
| Vercel build fails in 7–11s with `[0ms]` build time | `.vercelignore` excluded `scripts/` — prebuild can't find `check-flow-guardrails.mjs` | Never exclude `scripts/` in `.vercelignore`; only exclude `scripts/upload_pdfs_to_supabase.py` and `scripts/pipeline/` |
