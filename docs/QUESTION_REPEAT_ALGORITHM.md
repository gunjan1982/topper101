# Question Repeat Intelligence

Repeat detection is core Topper101 product logic. Students use it to decide what to study first, so the system must be evidence-first, explainable, tested, and easy to audit.

Runtime code lives in `src/lib/questionRepeatAlgorithm.ts`. Persisted output lives on `public.questions`.

Do not add repeat logic inside pages, components, import scripts, or one-off notebooks.

## Two-Layer Model

Topper101 separates two concepts that are easy to confuse:

1. `repeat_family_key`
   - Exact or near-exact semantic repeats.
   - Example: Sternberg's triarchic theory, Alfred Binet's contribution to intelligence testing, blocks to problem solving.
   - This is what question cards use to merge repeated TEE variations.

2. `study_hook_key`
   - Broader preparation zone / answer strategy.
   - Example: intelligence theories and testing contains Sternberg, Spearman, Binet, Guilford, PASS, IQ, and Gardner-style questions.
   - This is what makes expert prep guides useful without overstating exact question repetition.

Never show a study-hook count as though it were an exact repeat-family count.

## Persisted Columns

The production Supabase `questions` table stores:

- `repeat_family_key`
- `repeat_family_label`
- `study_hook_key`
- `study_hook_label`
- `repeat_algo_version`
- `repeat_intelligence_updated_at`
- `repeat_intelligence_reviewed_at`

Current persisted algorithm version:

```text
repeat-intelligence-v1
```

The dashboard course page should prefer persisted `repeat_family_key` and only fall back to runtime calculation for newly imported rows that have not yet been backfilled.

## Current Algorithm

`questionRepeatAlgorithm.ts` runs in these layers:

1. Clean OCR/import noise with `cleanQuestionText` in `src/lib/questionDisplay.ts`.
2. Match curated exact repeat families.
3. Match curated study hooks.
4. Fall back to normalized question wording when no exact family rule matches.
5. Fall back to the database topic, when available, for study hooks.

The course page groups question cards by `questionRepeatKey(...)`. Each grouped card shows all TEE variations and opens one representative answer, usually the longest reviewed answer.

## Guardrails

Run:

```bash
npm run repeat:check
```

This protects known high-value families and hook boundaries, including:

- Sternberg triarchic theory vs. Sternberg information-processing approach
- Alfred Binet and intelligence testing
- Spearman two-factor theory
- Problem-solving strategies vs. blocks vs. Gestalt
- Language acquisition / Chomsky / innateness variants
- Biological memory bases, including memory-brain and hippocampus variants
- Bloom taxonomy, aphasia, sensory/STM/LTM, Atkinson-Shiffrin, Waugh-Norman

The build guardrail runs this check automatically through `npm run guardrails`.

## Audits

Exact repeat families:

```bash
npm run repeat:audit -- data/questions_with_answers.json 3
```

Study hooks with exact families underneath:

```bash
npm run study:audit -- --course MPC-001 --min-sessions 2 --max-evidence 6
```

Backfill production Supabase after changing repeat logic:

```bash
npm run env:check
npm run repeat:backfill -- --dry-run
npm run repeat:backfill
npm run repeat:backfill -- --only-missing --dry-run
```

The final command should report `Rows needing update: 0`.

Use `study:audit` when comparing against expert prep PDFs. The correct comparison is usually:

- PDF high-priority item vs. `study_hook_key`
- PDF specific named question vs. `repeat_family_key`
- PDF claimed frequency vs. listed TEE evidence

## Calibration Rule

Expert PDFs are calibration artifacts, not source-of-truth data.

Use them to ask:

- Did the algorithm find the same high-yield zone?
- Did it separate exact repeated questions from broader prep hooks?
- Are any OCR variants or semantic variants missing?
- Can every count be defended by session-level evidence?

If a PDF says "Sternberg frequency 5" but the raw bank shows Sternberg exact repeats in 4 TEEs and intelligence-theory questions in 10 TEEs, the app must preserve that distinction.

## Honest Limitation

The current runtime algorithm is deterministic and explainable. That is good for trust, but it will miss deep semantic repeats when a concept has no rule yet.

For higher coverage, add an offline review pipeline:

1. Generate embeddings for cleaned question text within each course.
2. Cluster likely semantic repeats.
3. Ask an LLM to propose repeat-family labels and reject false positives.
4. Human-review the candidates.
5. Persist stable `repeat_family_key` and `study_hook_key` values for reviewed questions.

LangChain is not required. It can orchestrate the workflow, but the essential pieces are embeddings, clustering, LLM review, and human QA. Keep runtime grouping deterministic; use AI offline to propose candidates.
