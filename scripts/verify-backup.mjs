#!/usr/bin/env node
/**
 * scripts/verify-backup.mjs
 *
 * Runs as a weekly cron / manual check.
 * Verifies that:
 *   1. Supabase DB backup happened in the last 25 hours (via Management API)
 *   2. The public `pdfs` storage bucket is reachable and has objects
 *
 * Required env vars:
 *   SUPABASE_PROJECT_REF   — e.g. gayauvhhgwbbqgrqajak
 *   SUPABASE_ACCESS_TOKEN  — Personal Access Token from supabase.com/dashboard/account/tokens
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Run: node --no-warnings scripts/verify-backup.mjs
 */

import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const errors = [];
const results = [];

// ── 1. Check DB backup via Management API ────────────────────────────────────
if (!PROJECT_REF || !ACCESS_TOKEN) {
  errors.push('SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN not set — skipping DB backup check');
} else {
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/backups`,
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    if (!res.ok) {
      errors.push(`Management API returned ${res.status}: ${await res.text()}`);
    } else {
      const { backups } = await res.json();
      if (!Array.isArray(backups) || backups.length === 0) {
        errors.push('No backups found via Management API');
      } else {
        // Sort descending by created_at
        const sorted = backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latest = sorted[0];
        const ageHours = (Date.now() - new Date(latest.created_at).getTime()) / 3_600_000;
        if (ageHours > 25) {
          errors.push(`Latest DB backup is ${ageHours.toFixed(1)}h old (expected ≤25h). Backup: ${latest.created_at}`);
        } else {
          results.push(`✅ DB backup OK — latest: ${latest.created_at} (${ageHours.toFixed(1)}h ago)`);
        }
      }
    }
  } catch (err) {
    errors.push(`DB backup check failed: ${err.message}`);
  }
}

// ── 2. Check `pdfs` storage bucket reachable + non-empty ─────────────────────
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  errors.push('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set — skipping storage check');
} else {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.storage.from('pdfs').list('', { limit: 5 });
    if (error) {
      errors.push(`Storage bucket check failed: ${error.message}`);
    } else if (!data || data.length === 0) {
      errors.push('`pdfs` storage bucket appears empty — unexpected');
    } else {
      results.push(`✅ Storage bucket OK — found ${data.length}+ objects at root`);
    }
  } catch (err) {
    errors.push(`Storage check threw: ${err.message}`);
  }
}

// ── 3. Report ─────────────────────────────────────────────────────────────────
console.log('\n=== Backup Verification ===');
results.forEach((r) => console.log(r));
if (errors.length > 0) {
  console.error('\n🚨 BACKUP ISSUES FOUND:');
  errors.forEach((e) => console.error(' •', e));
  process.exit(1);
} else {
  console.log('\n✅ All backup checks passed');
}
