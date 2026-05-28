import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
// No caching — UptimeRobot hits this every 5 minutes
export const dynamic = 'force-dynamic';

export async function GET() {
  const startMs = Date.now();

  // Lightweight Supabase ping — count one row from a small table
  let dbOk = false;
  let dbMs: number | null = null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const t0 = Date.now();
    const { error } = await supabase
      .from('courses')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    dbMs = Date.now() - t0;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  // Filesystem check for traced textbooks
  const fsDiag: any = {
    cwd: process.cwd(),
    cwdFiles: [],
    foundChunksPaths: [],
    chunksFileError: null,
  };

  try {
    fsDiag.cwdFiles = fs.readdirSync(process.cwd());

    // Recursively find chunks.json files
    function findFileRecursive(dir: string, depth = 0) {
      if (depth > 6) return;
      let files: string[] = [];
      try {
        files = fs.readdirSync(dir);
      } catch {
        return;
      }

      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'cache' || file === '.next_cache') continue;
        const fullPath = path.join(dir, file);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          findFileRecursive(fullPath, depth + 1);
        } else if (file === 'chunks.json') {
          fsDiag.foundChunksPaths.push({
            path: fullPath,
            size: stat.size,
          });
        }
      }
    }

    findFileRecursive(process.cwd());
  } catch (err: any) {
    fsDiag.chunksFileError = err.message;
  }

  const overallOk = dbOk;
  const totalMs = Date.now() - startMs;

  return NextResponse.json(
    {
      ok: overallOk,
      db: { ok: dbOk, latencyMs: dbMs },
      fs: fsDiag,
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? 'dev',
      uptimeMs: totalMs,
    },
    { status: overallOk ? 200 : 503 }
  );
}

