import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const examOrder = [
  'MPCE-011',
  'MPCE-021',
  'MPCE-031',
  'MPCE-012',
  'MPCE-022',
  'MPCE-032',
  'MPCE-013',
  'MPCE-023',
  'MPCE-033',
  'MPCE-046',
  'MPC-001',
  'MPC-002',
  'MPC-003',
  'MPC-004',
  'MPC-005',
  'MPC-006',
];

function hasFlag(args, name) {
  return args.includes(name);
}

function readLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('Missing .env.local. Run npm run env:sync first.');

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

function firstFreeSubject(papers) {
  const selected = new Set(papers);
  return examOrder.find((courseCode) => selected.has(courseCode)) ?? papers[0] ?? null;
}

async function main() {
  const dryRun = hasFlag(process.argv.slice(2), '--dry-run');
  const env = readLocalEnv();
  const supabase = createClient(
    required(env, 'NEXT_PUBLIC_SUPABASE_URL'),
    required(env, 'SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: users, error } = await supabase
    .from('users')
    .select('id, selected_papers, onboarding_complete')
    .eq('onboarding_complete', true);

  if (error) throw new Error(error.message);

  const candidates = (users ?? [])
    .map((user) => ({
      user,
      courseCode: firstFreeSubject((user.selected_papers ?? [])),
    }))
    .filter((item) => item.courseCode);

  const { data: existing, error: existingError } = await supabase
    .from('user_entitlements')
    .select('user_id, course_code, source')
    .eq('entitlement_type', 'subject_unlock')
    .eq('source', 'signup_free');

  if (existingError) throw new Error(existingError.message);

  const existingKeys = new Set((existing ?? []).map((row) => `${row.user_id}:${row.course_code}`));
  const inserts = candidates.filter(({ user, courseCode }) => !existingKeys.has(`${user.id}:${courseCode}`));

  console.log(`Onboarded users scanned: ${(users ?? []).length}`);
  console.log(`Signup-free entitlements to create: ${inserts.length}`);

  if (dryRun) {
    console.log('Dry run only. No database rows were changed.');
    return;
  }

  if (inserts.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  const { error: insertError } = await supabase
    .from('user_entitlements')
    .upsert(inserts.map(({ user, courseCode }) => ({
      user_id: user.id,
      entitlement_type: 'subject_unlock',
      course_code: courseCode,
      source: 'signup_free',
      metadata: { reason: 'Backfilled first free paper for existing onboarded user' },
    })), { onConflict: 'user_id,entitlement_type,course_code,source' });

  if (insertError) throw new Error(insertError.message);

  console.log(`Backfilled ${inserts.length} signup-free subject entitlements.`);
}

main().catch((error) => {
  console.error('Free subject entitlement backfill failed.');
  console.error(error.message);
  process.exit(1);
});
