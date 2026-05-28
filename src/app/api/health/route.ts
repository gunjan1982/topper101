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
    directFileExists: false,
    directFileError: null,
    directFileSnippet: null,
  };

  try {
    const chunksPath = path.join(process.cwd(), 'data', 'textbooks', 'MPC-001', 'chunks.json');
    fsDiag.directFileExists = fs.existsSync(chunksPath);

    if (fsDiag.directFileExists) {
      const raw = fs.readFileSync(chunksPath, 'utf8');
      fsDiag.directFileSnippet = raw.slice(0, 100);
    }
  } catch (err: any) {
    fsDiag.directFileError = err.message;
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

