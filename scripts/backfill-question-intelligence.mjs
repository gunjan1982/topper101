import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadRepeatAlgorithm } from './lib/repeat-algorithm-loader.mjs';

const {
  QUESTION_INTELLIGENCE_ALGO_VERSION,
  questionIntelligence,
} = loadRepeatAlgorithm();

const PAGE_SIZE = 500;
const UPDATE_CONCURRENCY = 12;

function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function hasFlag(args, name) {
  return args.includes(name);
}

function readLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local. Run npm run env:sync first.');
  }

  const env = {};
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const index = trimmed.indexOf('=');
    if (index === -1) return;

    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[trimmed.slice(0, index)] = value;
  });

  return env;
}

function required(env, key) {
  if (!env[key]) throw new Error(`${key} is missing. Run npm run env:sync first.`);
  return env[key];
}

function courseCode(row) {
  return row.courses?.code ?? row.course_code ?? row.courseCode ?? row.course ?? 'UNKNOWN';
}

function sessionKey(row) {
  return `${row.session ?? 'Unknown'}-${row.year ?? 'Unknown'}`;
}

async function fetchAllQuestions(supabase, courseFilter) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    let query = supabase
      .from('questions')
      .select(`
        id,
        question_text,
        marks,
        topic,
        year,
        session,
        section,
        repeat_family_key,
        repeat_family_label,
        study_hook_key,
        study_hook_label,
        repeat_algo_version,
        courses(code)
      `)
      .order('year', { ascending: false })
      .order('session', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (courseFilter) {
      query = query.eq('courses.code', courseFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch questions: ${error.message}`);

    const pageRows = (data ?? []).filter((row) => !courseFilter || row.courses?.code === courseFilter);
    rows.push(...pageRows);

    if (!data || data.length < PAGE_SIZE) break;
  }

  const uniqueRows = new Map();
  rows.forEach((row) => uniqueRows.set(row.id, row));

  return [...uniqueRows.values()];
}

function needsUpdate(row, intelligence) {
  return (
    row.repeat_family_key !== intelligence.repeatFamilyKey ||
    row.repeat_family_label !== intelligence.repeatFamilyLabel ||
    row.study_hook_key !== intelligence.studyHookKey ||
    row.study_hook_label !== intelligence.studyHookLabel ||
    row.repeat_algo_version !== QUESTION_INTELLIGENCE_ALGO_VERSION
  );
}

function buildPatch(intelligence) {
  return {
    repeat_family_key: intelligence.repeatFamilyKey,
    repeat_family_label: intelligence.repeatFamilyLabel,
    study_hook_key: intelligence.studyHookKey,
    study_hook_label: intelligence.studyHookLabel,
    repeat_algo_version: QUESTION_INTELLIGENCE_ALGO_VERSION,
    repeat_intelligence_updated_at: new Date().toISOString(),
  };
}

async function runPool(items, worker) {
  const failures = [];
  let index = 0;

  async function runWorker() {
    for (;;) {
      const current = index;
      index += 1;
      if (current >= items.length) return;

      try {
        await worker(items[current], current);
      } catch (error) {
        failures.push({ item: items[current], error });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(UPDATE_CONCURRENCY, items.length) }, runWorker));
  return failures;
}

function printSummary(rows, computed) {
  const hooks = new Map();
  const families = new Map();
  const sessionsByHook = new Map();

  computed.forEach(({ row, intelligence }) => {
    hooks.set(intelligence.studyHookLabel, (hooks.get(intelligence.studyHookLabel) ?? 0) + 1);
    families.set(intelligence.repeatFamilyLabel, (families.get(intelligence.repeatFamilyLabel) ?? 0) + 1);

    const hookSessions = sessionsByHook.get(intelligence.studyHookLabel) ?? new Set();
    hookSessions.add(sessionKey(row));
    sessionsByHook.set(intelligence.studyHookLabel, hookSessions);
  });

  console.log(`Questions scanned: ${rows.length}`);
  console.log(`Algorithm version: ${QUESTION_INTELLIGENCE_ALGO_VERSION}`);
  console.log('\nTop study hooks:');
  [...hooks.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .forEach(([label, count]) => {
      const teeCount = sessionsByHook.get(label)?.size ?? 0;
      console.log(`- ${label}: ${teeCount} TEEs · ${count} questions`);
    });

  console.log('\nTop exact repeat families:');
  [...families.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .forEach(([label, count]) => {
      console.log(`- ${label}: ${count} questions`);
    });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = hasFlag(args, '--dry-run');
  const courseFilter = optionValue(args, '--course');
  const onlyMissing = hasFlag(args, '--only-missing');

  const env = readLocalEnv();
  const supabase = createClient(
    required(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    required(env, 'SUPABASE_SERVICE_ROLE_KEY'),
  );

  const rows = await fetchAllQuestions(supabase, courseFilter);
  const computed = rows.map((row) => {
    const code = courseCode(row);
    return {
      row,
      intelligence: questionIntelligence({
        ...row,
        course_code: code,
        topic: row.topic,
      }),
    };
  });

  const updates = computed.filter(({ row, intelligence }) => {
    if (onlyMissing && row.repeat_family_key && row.study_hook_key) return false;
    return needsUpdate(row, intelligence);
  });

  printSummary(rows, computed);
  console.log(`\nRows needing update: ${updates.length}`);

  if (dryRun) {
    console.log('Dry run only. No database rows were changed.');
    return;
  }

  const failures = await runPool(updates, async ({ row, intelligence }) => {
    const { error } = await supabase
      .from('questions')
      .update(buildPatch(intelligence))
      .eq('id', row.id);

    if (error) throw new Error(`${row.id}: ${error.message}`);
  });

  if (failures.length > 0) {
    console.error(`Backfill completed with ${failures.length} failures.`);
    failures.slice(0, 10).forEach(({ item, error }) => {
      console.error(`- ${item.row.id}: ${error.message}`);
    });
    process.exit(1);
  }

  console.log(`Backfill complete. Updated ${updates.length} question rows.`);
}

main().catch((error) => {
  console.error('Question intelligence backfill failed.');
  console.error(error.message);
  process.exit(1);
});
