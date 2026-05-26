#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const INFISICAL_DOMAIN = 'https://eu.infisical.com/api';
const INFISICAL_ENV = process.env.INFISICAL_ENV || 'prod';

const secretMap = {
  TOPPER101_SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  TOPPER101_SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  TOPPER101_SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  TOPPER101_RAZORPAY_KEY_ID: 'RAZORPAY_KEY_ID',
  TOPPER101_RAZORPAY_KEY_SECRET: 'RAZORPAY_KEY_SECRET',
  TOPPER101_RAZORPAY_WEBHOOK_SECRET: 'RAZORPAY_WEBHOOK_SECRET',
  TOPPER101_POSTHOG_KEY: 'NEXT_PUBLIC_POSTHOG_KEY',
  TOPPER101_POSTHOG_HOST: 'NEXT_PUBLIC_POSTHOG_HOST',
  TOPPER101_SITE_URL: 'NEXT_PUBLIC_SITE_URL',
  DEEPSEEK_API_KEY: 'DEEPSEEK_API_KEY',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  NEXT_PUBLIC_SENTRY_DSN: 'NEXT_PUBLIC_SENTRY_DSN',
};

function parseSecrets(raw) {
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : parsed.secrets ?? [];
  const secrets = new Map();

  rows.forEach((row) => {
    const key = row.secretKey ?? row.key ?? row.name;
    const value = row.secretValue ?? row.value;
    if (key && typeof value === 'string') secrets.set(key, value);
  });

  return secrets;
}

function renderDotenv(values) {
  const lines = [
    '# Created from Infisical by `npm run env:sync`',
    `# Source: ${INFISICAL_DOMAIN}, env=${INFISICAL_ENV}`,
  ];

  Object.entries(secretMap).forEach(([sourceKey, targetKey]) => {
    const value = values.get(sourceKey);
    if (!value) return;
    lines.push(`${targetKey}=${JSON.stringify(value)}`);

    if (targetKey === 'RAZORPAY_KEY_ID') {
      lines.push(`NEXT_PUBLIC_RAZORPAY_KEY_ID=${JSON.stringify(value)}`);
    }
  });

  return `${lines.join('\n')}\n`;
}

function main() {
  const output = execFileSync(
    'infisical',
    ['export', '--domain', INFISICAL_DOMAIN, '--env', INFISICAL_ENV, '--format', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const secrets = parseSecrets(output);
  const missing = Object.keys(secretMap).filter((sourceKey) => !secrets.get(sourceKey));
  if (missing.length > 0) {
    throw new Error(`Missing Infisical secrets: ${missing.join(', ')}`);
  }

  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), `.env.local.backup-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`);
    fs.copyFileSync(envPath, backupPath);
  }

  fs.writeFileSync(envPath, renderDotenv(secrets));
  console.log(`Synced ${Object.keys(secretMap).length} secret mappings from Infisical ${INFISICAL_ENV} to .env.local.`);
  console.log('Secret values were not printed.');
}

try {
  main();
} catch (error) {
  console.error('Infisical env sync failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
