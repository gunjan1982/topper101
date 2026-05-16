# Repeat Intelligence Operating Process

This is the process for turning raw IGNOU TEE papers into trustworthy Topper101 study intelligence.

## Source Of Truth

The source of truth is the raw question bank:

- course code
- exact TEE session, such as `Jun 2025` or `Dec 2024`
- section
- marks
- original question text
- reviewed answer status

Expert prep PDFs are calibration material. They should not overwrite raw question evidence.

## Pipeline

1. Import raw TEE questions.
2. Clean OCR and footer noise in `src/lib/questionDisplay.ts`.
3. Classify exact repeats with `questionRepeatKey(...)`.
4. Classify broader prep hooks with `questionStudyHookKey(...)`.
5. Persist keys to Supabase with `npm run repeat:backfill`.
6. Audit exact families with `npm run repeat:audit`.
7. Audit study hooks with `npm run study:audit`.
8. Compare against expert PDFs.
9. Add missing repeat/hook rules only in `src/lib/questionRepeatAlgorithm.ts`.
10. Add guardrail cases in `scripts/check-repeat-algorithm.mjs`.
11. Run `npm run guardrails`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

## Supabase Persistence

The `questions` table stores the current repeat intelligence:

- `repeat_family_key`
- `repeat_family_label`
- `study_hook_key`
- `study_hook_label`
- `repeat_algo_version`
- `repeat_intelligence_updated_at`
- `repeat_intelligence_reviewed_at`

Migration:

```text
supabase/migrations/20260516203500_persist_question_intelligence.sql
```

Current version:

```text
repeat-intelligence-v1
```

Backfill command:

```bash
npm run env:check
npm run repeat:backfill -- --dry-run
npm run repeat:backfill
```

Completion check:

```bash
npm run repeat:backfill -- --only-missing --dry-run
```

The completion check must report `Rows needing update: 0`.

## Decision Rules

- If two questions require essentially the same answer body, they can share a `repeat_family_key`.
- If two questions belong to the same preparation zone but require different answer bodies, they should share a `study_hook_key` but keep separate `repeat_family_key` values.
- If a rule is added because of one known failure, add at least one regression example for it.
- If the source evidence is unclear, prefer a narrower family and a broader study hook.
- Do not show a broad hook frequency as exact repeat frequency.
- If runtime logic changes, backfill Supabase before deploying UI that depends on it.
- If a backfill paginates Supabase rows, use deterministic ordering. Non-unique ordering can skip rows across `.range(...)` pages.

## MPC-001 Calibration Findings

The first calibration pass against the Dec 2025 MPC-001 prep PDF showed:

- The PDF agrees strongly with the broad high-yield hooks: intelligence theories, memory models, problem solving, cognitive psychology foundations, creativity, language acquisition, and speech/language disorders.
- The PDF sometimes labels a broad hook with a specific answer strategy. Example: Atkinson-Shiffrin is a good memory-model study hook, but the exact Atkinson-Shiffrin family is narrower than the full memory-model topic.
- Some OCR variants needed explicit rules, such as `Stemberg` for Sternberg and Chomsky/innateness variants for language acquisition.
- The app must preserve both layers so students can see why a concept matters without being misled about exact repetition.

The first production backfill stored repeat intelligence for all 1,614 loaded questions with zero missing family/hook keys.

## Future Upgrade

When the curated rules become too large, move discovery offline:

- Generate embeddings for cleaned questions.
- Cluster within the same course.
- Use an LLM to propose candidate families/hooks with evidence.
- Human-review and persist stable keys.
- Keep runtime code deterministic and simple.
