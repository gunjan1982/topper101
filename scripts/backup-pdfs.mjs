#!/usr/bin/env node
/**
 * scripts/backup-pdfs.mjs
 *
 * Downloads all PDFs from the public `pdfs` Supabase storage bucket
 * to a local backup folder (`data/backups/pdfs/`).
 *
 * Usage:
 *   node scripts/backup-pdfs.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
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
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = 'pdfs';
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups', 'pdfs');

async function downloadFile(bucketPath, localPath) {
  // Ensure local directory exists
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(bucketPath);

  if (error) {
    console.error(`  ✗ Failed to download ${bucketPath}: ${error.message}`);
    return false;
  }

  const arrayBuffer = await data.arrayBuffer();
  fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
  console.log(`  ✓ Backed up ${bucketPath} -> ${localPath}`);
  return true;
}

async function scanAndDownload(dirPath = '') {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(dirPath, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' }
  });

  if (error) {
    console.error(`Error listing files in storage bucket at path "${dirPath}": ${error.message}`);
    return;
  }

  for (const item of data) {
    const itemPath = dirPath ? `${dirPath}/${item.name}` : item.name;

    if (item.id === null) {
      // It's a folder/directory (id is null in Supabase storage list output for metadata folders)
      // Recurse into directory
      await scanAndDownload(itemPath);
    } else {
      // It's a file
      const localFilePath = path.join(BACKUP_DIR, itemPath);
      
      // Skip if file already exists with same size
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        if (stats.size === item.metadata.size) {
          console.log(`  - Skipping (already backed up): ${itemPath}`);
          continue;
        }
      }

      await downloadFile(itemPath, localFilePath);
    }
  }
}

async function main() {
  console.log(`Starting PDF Storage Backup from bucket "${BUCKET_NAME}"...`);
  console.log(`Target local backup directory: ${BACKUP_DIR}`);

  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    await scanAndDownload();
    console.log('\nBackup process completed successfully.');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();
