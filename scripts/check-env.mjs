#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');

function readLocalEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing .env.local. Create it from .env.example or the project secrets vault.');
  }

  const env = {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function assertPresent(env, key) {
  const value = env[key];
  if (!value || value === '""') {
    throw new Error(`${key} is missing or empty in .env.local.`);
  }
  return value;
}

async function countRows(supabase, table) {
  const { count, error, status } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(`${table}: ${error.message} (${error.code ?? status})`);
  }

  return count ?? 0;
}

async function main() {
  const env = readLocalEnv();
  const url = assertPresent(env, 'NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = assertPresent(env, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = assertPresent(env, 'SUPABASE_SERVICE_ROLE_KEY');

  if (url.endsWith('.supabase.co') === false) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase project URL.');
  }

  const supabase = createClient(url, serviceRoleKey || anonKey);
  const [courses, questions, clusters] = await Promise.all([
    countRows(supabase, 'courses'),
    countRows(supabase, 'questions'),
    countRows(supabase, 'topic_clusters'),
  ]);

  if (courses === 0 || questions === 0 || clusters === 0) {
    throw new Error(
      `Supabase is reachable but content tables are empty: courses=${courses}, questions=${questions}, topic_clusters=${clusters}. ` +
      'This is not the populated Topper101 audit database.'
    );
  }

  console.log('Environment check passed.');
  console.log(`Supabase project: ${new URL(url).host}`);
  console.log(`courses: ${courses}`);
  console.log(`questions: ${questions}`);
  console.log(`topic_clusters: ${clusters}`);
}

main().catch((error) => {
  console.error('Environment check failed.');
  console.error(error.message);
  process.exit(1);
});
