# Project Map

This map documents the main files in the Topper101 app and the user flow each file owns. Keep it updated whenever routes, navigation, or auth behavior changes.

For environment and Supabase audit setup, read `docs/ENVIRONMENT.md` before running data scripts.

## App Shell

- `src/app/layout.tsx`: root HTML shell, global metadata, providers, and app-wide favicon/icon metadata.
- `src/app/providers.tsx`: client provider wrapper for analytics and app-level client context.
- `src/app/globals.css`: global styles and Tailwind imports.
- `src/app/Logo.tsx`: reusable Topper101 logo used by landing, onboarding, and dashboard.
- `src/middleware.ts`: route protection and auth-page redirect handling. This is the only middleware redirect gate.
- `public/sw.js`: PWA Service Worker implementing offline page caching and ranges-based PDF intercepts.

## Navigation Rules

- `src/lib/routes.ts`: central route names, protected route prefixes, auth route prefixes, and dashboard nav links.
- `src/lib/navigation.ts`: shared helpers for safe local `next` paths and CTA redirect URLs.
- Public CTAs that start an authenticated flow should use `withRedirectTo('/signup', '/target')`.
- Auth pages read and preserve `next`; logged-in users who hit `/login` or `/signup` are redirected to that safe `next` path.
- Unauthenticated users who open protected routes are redirected to `/login?next=<current path>`.

## Public Marketing

- `src/app/page.tsx`: public landing page, Concept Tree preview, feature summary, public pricing cards, and public signup CTAs.
- `src/app/ExamSchedulePreview.tsx`: public June 2026 TEE schedule preview used to help students identify their first paper before signup.
- `src/app/guide/page.tsx`: public IGNOU MAPC study guide (no auth required). Covers Year 1/2 course cards, TEE exam format (Section A/B/C), stream options, 6 study tips, and a 10-item FAQ accordion. Statically generated (`○`). Linked from dashboard nav as "Guide".
- `src/app/guide/FaqAccordion.tsx`: client-side accordion for the FAQ section of the guide page.
- Public preview links should use page anchors like `#concept-tree` when the user is meant to keep exploring before signup.
- Do not link a preview CTA to `/signup` unless the CTA text clearly says the user is creating an account.

## Auth

- `src/app/(auth)/login/page.tsx`: email login UI, optional Google login form, and signup cross-link. Preserves `next`.
- `src/app/(auth)/signup/page.tsx`: email signup UI, optional Google signup form, and login cross-link. Preserves `next`.
- `src/app/(auth)/reset-password/page.tsx`: password reset request UI.
- `src/app/(auth)/actions.ts`: email login/signup, feature-gated Google OAuth start, auth callback URL construction, and logout server actions.
- `src/app/auth/callback/route.ts`: OAuth callback, user row creation for Google users, analytics capture, and final redirect to `next`.
- `src/app/api/auth/reset-password/route.ts`: API route handler to exchange reset codes for a session and redirect to the password update page.
- `src/lib/authConfig.ts`: auth feature flags shared by auth pages and server actions.
- Google auth must stay hidden unless `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and Supabase Google provider is enabled.

## Onboarding

- `src/app/onboarding/layout.tsx`: centered onboarding shell.
- `src/app/onboarding/year/page.tsx`: Year 1 vs Year 2 selection.
- `src/app/onboarding/stream/page.tsx`: Year 2 stream selection.
- `src/app/onboarding/papers/page.tsx`: loads the correct paper list for selected year/stream and shows current filter context.
- `src/app/onboarding/papers/PaperSelectionForm.tsx`: client paper picker and onboarding completion submit.
- `src/app/onboarding/actions.ts`: updates year, stream, selected papers, and onboarding completion.

## Dashboard

- `src/app/(dashboard)/layout.tsx`: authenticated app shell and dashboard header. Only link to implemented routes.
- `src/app/(dashboard)/dashboard/page.tsx`: dashboard redirect checks, selected paper cards, progress summaries, and upgrade banner. Includes the `<ReferralDashboard />` sharing widget.
- `src/app/(dashboard)/dashboard/ReferralDashboard.tsx`: client component for copying referral links, native share buttons, rewards track progress bar, and referred signups history log.
- `src/app/(dashboard)/settings/page.tsx`: settings page data loading.
- `src/app/(dashboard)/settings/SettingsForm.tsx`: client UI for changing year, stream, and selected papers. Contains URNA waitlist career checkbox toggle.
- `src/app/(dashboard)/settings/actions.ts`: persists settings changes and handles URNA opt-ins.
- `src/app/(dashboard)/pricing/page.tsx`: protected Razorpay checkout page.
- `src/app/admin/requests/page.tsx`: administrative QA answer moderation dashboard.
- `src/app/admin/requests/QuestionReviewCard.tsx`: side-by-side edit/preview interface to update drafts and publish answers as human-reviewed.
- `src/app/admin/requests/actions.ts`: server actions to save drafts and publish answers.

## Courses And Assignments

- `src/app/(dashboard)/courses/[courseCode]/page.tsx`: course question bank, filters, heat-map clusters, question cards, and server-side textbook chunk matching. Uses a 2-column layout on `lg` screens (questions left, PDF panels right).
- `src/app/(dashboard)/courses/[courseCode]/components/QuestionCard.tsx`: question display, AI answer modal, free-credit/paywall behavior. Dispatches a `textbookJump` CustomEvent on click carrying `{ page, excerpt }` for the textbook panel. Launches the `<ConceptDrawer />` on concept trigger.
- `src/app/(dashboard)/courses/[courseCode]/components/ConceptDrawer.tsx`: slide-out drawer showing psychology concepts tested by that question, Layer 3+ freemium locks, screenshot text-copy protection overlays, and cross-course links (`related_nodes`).
- `src/app/(dashboard)/courses/[courseCode]/components/CoursePdfPanels.tsx`: sticky right-column panels (desktop only, `hidden lg:flex`). Top panel: Q-paper PDF (iframe, session dropdown, redirects to Supabase Storage). Bottom panel: textbook PDF viewer (iframe) — displays the textbook PDF from Supabase Storage and jumps to the matched page on question selection, with copy/download/print protections and a bottom context excerpt strip.
- `src/app/(dashboard)/courses/actions.ts`: question progress, answer fetch, and user progress server actions.
- `src/app/(dashboard)/courses/[courseCode]/assignments/page.tsx`: assignment year list for theory courses.
- `src/app/(dashboard)/courses/[courseCode]/assignments/[year]/page.tsx`: assignment questions for a year.
- `src/app/(dashboard)/courses/[courseCode]/assignments/[year]/AssignmentQuestionCard.tsx`: assignment question display and gated answer generation UI.

## APIs And Integrations

- `src/app/api/payments/create-order/route.ts`: creates Razorpay orders.
- `src/app/api/payments/verify/route.ts`: verifies Razorpay payment signatures client-side and upgrades plan tier and entitlements synchronously.
- `src/app/api/payments/webhook/route.ts`: handles Razorpay payment webhooks asynchronously to upgrade plan tier and entitlements as a failover.
- `src/app/api/assignments/generate-answer/route.ts`: generates/caches assignment answers.
- `src/app/api/pdf/qpaper/[courseCode]/route.ts`: serves past-paper PDFs. In dev: reads local `data/past_papers/` files with range-request support. In production: 302 redirects to the Supabase Storage public bucket `pdfs`. Dec 2025 papers redirect to `past-papers-dec2025/{code}.pdf`.
- `src/app/api/pdf/textbook/[courseCode]/route.ts`: local-only textbook PDF server (reads from local `data/textbooks/` with range-request support for development).
- `src/app/api/pdf/textbook/[courseCode]/url/route.ts`: API endpoint that returns the resolved Supabase Storage textbook URL as JSON, allowing the client-side PDF iframe to load the textbook with `#page=N` fragment preserved.
- `src/lib/razorpay.ts`: Razorpay client setup.
- `src/lib/payments-service.ts`: shared database subscription and entitlement granting service.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client.
- `src/lib/posthog-server.ts`: server-side PostHog capture helper.

## Data

- `src/lib/courseCatalog.ts`: static MAPC course catalog fallback and course lookup helpers. This avoids blank onboarding/dashboard states when the database catalog is missing or incomplete.
- `MAPC_STREAMS` in `src/lib/courseCatalog.ts`: the single source for Year 2 stream options shown in onboarding and settings.
- `src/lib/examSchedule.ts`: single source for June 2026 TEE schedule data, official IGNOU date-sheet source URL, date formatting, and next-exam helpers. Do not duplicate exam dates in pages or components.
- `src/lib/entitlements.ts`: central access model for free subject unlocks, referral unlocks, and paid plan checks. Do not hardcode pricing access in UI components.
- `src/lib/questionDisplay.ts`: cleans OCR/import noise from questions and formats question/TEE display text.
- `src/lib/questionRepeatAlgorithm.ts`: central question intelligence module for exact repeat families and broader study hooks. Do not add repeat grouping rules inside UI components, import scripts, or one-off notebooks.
- `scripts/check-repeat-algorithm.mjs`: guardrail for known semantic repeat families.
- `scripts/audit-repeat-groups.mjs`: local audit tool for reviewing repeat-family output across the question bank.
- `scripts/audit-study-hooks.mjs`: local audit tool for reviewing broad study hooks, exact families inside each hook, TEE evidence, and mean marks.
- `scripts/backfill-question-intelligence.mjs`: writes `repeat_family_*`, `study_hook_*`, and `repeat_algo_version` to Supabase `questions`.
- `scripts/backfill-free-subject-entitlements.mjs`: grants the first free subject entitlement to existing onboarded users.
- `docs/QUESTION_REPEAT_ALGORITHM.md`: explanation, limitations, and audit workflow for repeat-family and study-hook detection.
- `docs/REPEAT_INTELLIGENCE_PROCESS.md`: operating process for raw question evidence, PDF calibration, guardrails, and future semantic-clustering upgrades.
- `docs/PRICING_AND_ENTITLEMENTS.md`: pricing-access model, free first subject, referral rewards, and entitlement backfill workflow.
- `supabase/migrations/20260516203500_persist_question_intelligence.sql`: additive migration for persisted question intelligence columns and indexes.
- `supabase/migrations/20260516210500_subject_entitlements_referrals.sql`: additive migration for subject unlock entitlements and referral records.
- `scripts/sync-env-from-infisical.mjs`: pulls Topper101 secrets from Infisical EU Cloud `prod` and maps `TOPPER101_*` names to the app's `.env.local` keys.
- `scripts/check-env.mjs`: verifies `.env.local` points at a populated Supabase project before audits or data work.
- `docs/ENVIRONMENT.md`: required reference for Infisical mappings, expected Supabase project, audit setup, and common environment failures.
- `supabase/schema.sql`: database schema.
- `scripts/seed.js`: local seed script.
- `scripts/link-concepts.mjs`: parses concept keywords/theorists to map connections across courses and populate the `related_nodes` JSONB field in Supabase.
- `scripts/verify-backup.mjs`: checks database and storage bucket connectivity and logs backup status.

## Data Pipeline

The `scripts/pipeline/` directory contains the full offline pipeline for building the question bank and textbook chunks. Run from the pipeline venv (`scripts/pipeline/venv/`). Steps in order:

| Script | Purpose |
|---|---|
| `00b_download_sources.py` | Download past-paper PDFs from IGNOU |
| `01_extract_questions.py` | OCR/extract questions from PDFs into `data/raw_questions.json` |
| `02_cluster_topics.py` | Cluster questions into topic groups |
| `03_calculate_frequency.py` | Calculate per-cluster repeat frequency |
| `04_generate_answers.py` | Generate AI answers via DeepSeek API |
| `05_seed_database.py` | Upsert questions, clusters, and answers into Supabase |
| `06_upload_pdfs.py` | Upload past-paper PDFs to Supabase Storage bucket `pdfs` |
| `config.py` | Shared paths and config for all pipeline scripts |
| `run_all.sh` | Runs all steps end to end |

Extracted textbook chunks live in `data/textbooks/{courseCode}/chunks.json` with fields `{course_code, chunk_id, text, page_start, page_end, word_count}`. These are read server-side in `page.tsx` to match questions to textbook passages and determine textbook page citations.

December 2025 papers are stored separately in `data/past_papers_dec2025/{courseCode}.pdf` (downloaded from `ignou.ac.in/viewFile/ldd/qpdec2025/`).

## Cleanup Checklist For Flow Changes

When changing a route or user flow, complete this checklist in the same change:

- Search for old route strings with `rg`.
- Replace or remove stale CTAs, redirects, forms, and empty-state links.
- Keep official exam dates in `src/lib/examSchedule.ts`; remove any hardcoded schedule or countdown in route files.
- Remove dead dashboard navigation entries until their pages exist.
- Keep one helper responsible for shared navigation logic.
- Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- Smoke-check the changed route locally or on the deployed URL.
