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
    searchedPaths: {},
    chunksFileExists: false,
    chunksFileError: null,
    chunksFileSize: null,
  };

  try {
    fsDiag.cwdFiles = fs.readdirSync(process.cwd());
    
    // Check various possible locations where 'data' or 'workspace' might reside
    const potentialPaths = [
      path.join(process.cwd(), 'data'),
      path.join(process.cwd(), 'workspace', 'topper101', 'data'),
      path.join(process.cwd(), '.next', 'server', 'data'),
    ];

    for (const p of potentialPaths) {
      fsDiag.searchedPaths[p] = {
        exists: fs.existsSync(p),
        isDir: fs.existsSync(p) ? fs.statSync(p).isDirectory() : false,
      };

      if (fsDiag.searchedPaths[p].exists) {
        const mpc001Path = path.join(p, 'textbooks', 'MPC-001');
        const mpc001Exists = fs.existsSync(mpc001Path);
        fsDiag.searchedPaths[p].mpc001Exists = mpc001Exists;

        if (mpc001Exists) {
          const chunksPath = path.join(mpc001Path, 'chunks.json');
          const chunksExists = fs.existsSync(chunksPath);
          fsDiag.searchedPaths[p].chunksExists = chunksExists;

          if (chunksExists) {
            fsDiag.chunksFileExists = true;
            fsDiag.chunksFileSize = fs.statSync(chunksPath).size;
            fsDiag.foundInPath = chunksPath;
          }
        }
      }
    }
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

