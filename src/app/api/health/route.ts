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
    dirname: __dirname,
    searchedRelativePaths: {},
    foundPath: null,
  };

  try {
    // Resolve relative paths from __dirname (up to 7 levels)
    let currentDir = __dirname;
    for (let i = 0; i <= 7; i++) {
      const targetPath = path.join(currentDir, 'data', 'textbooks', 'MPC-001', 'chunks.json');
      const targetDir = path.join(currentDir, 'data');
      
      fsDiag.searchedRelativePaths[i] = {
        dirPath: targetDir,
        dirExists: fs.existsSync(targetDir),
        filePath: targetPath,
        fileExists: fs.existsSync(targetPath),
      };

      if (fsDiag.searchedRelativePaths[i].fileExists) {
        fsDiag.foundPath = targetPath;
        fsDiag.foundLevel = i;
        break;
      }
      
      currentDir = path.dirname(currentDir);
    }
  } catch (err: any) {
    fsDiag.error = err.message;
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

