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
    tree: {},
    foundPaths: [],
    error: null,
  };

  try {
    function buildTree(dir: string, currentBranch: any, depth = 0) {
      if (depth > 10) return;
      let files: string[] = [];
      try {
        files = fs.readdirSync(dir);
      } catch (err: any) {
        currentBranch['$error'] = err.message;
        return;
      }

      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'cache' || file === '.next_cache' || file === '.v8-cache') continue;
        const fullPath = path.join(dir, file);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }

        if (stat.isDirectory()) {
          currentBranch[file] = {};
          buildTree(fullPath, currentBranch[file], depth + 1);
        } else {
          currentBranch[file] = stat.size;
          if (file === 'chunks.json' || file.endsWith('.json')) {
            fsDiag.foundPaths.push(fullPath);
          }
        }
      }
    }

    buildTree(process.cwd(), fsDiag.tree);
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

