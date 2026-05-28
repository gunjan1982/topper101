import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = 'pdfs';

function safeCourseCode(code: string): string | null {
  const cleaned = code.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  return /^[A-Z0-9-]{3,12}$/.test(cleaned) ? cleaned : null;
}

function supabasePublicUrl(bucketPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${bucketPath}`;
}

function serveFileLocally(filePath: string, request: NextRequest): NextResponse {
  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }

  const range = request.headers.get('range');
  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (!match) return new NextResponse('Bad Range', { status: 416 });
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;
    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    const body = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as Buffer)));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() { stream.destroy(); },
    });
    return new NextResponse(body, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      },
    });
  }

  const stream = createReadStream(filePath);
  const body = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as Buffer)));
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
    cancel() { stream.destroy(); },
  });
  return new NextResponse(body, {
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(size),
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  const { courseCode } = await params;
  const safeCode = safeCourseCode(courseCode);
  if (!safeCode) return new NextResponse('Bad Request', { status: 400 });

  const year = request.nextUrl.searchParams.get('year')?.replace(/[^0-9]/g, '');
  const session = request.nextUrl.searchParams.get('session')?.replace(/[^A-Za-z]/g, '');
  if (!year || !session) return new NextResponse('Bad Request', { status: 400 });

  const dataDir = path.join(process.cwd(), 'data');
  const filename = `${safeCode}_${session}_${year}.pdf`;
  const localPath = path.join(dataDir, 'past_papers', safeCode, filename);

  // Dec 2025 special case
  const isDec2025 = year === '2025' && session === 'December';
  const localDec2025 = path.join(dataDir, 'past_papers_dec2025', `${safeCode}.pdf`);

  // In dev: serve from local filesystem if available
  if (process.env.NODE_ENV === 'development') {
    if (existsSync(localPath)) return serveFileLocally(localPath, request);
    if (isDec2025 && existsSync(localDec2025)) return serveFileLocally(localDec2025, request);
  }

  // Redirect to Supabase Storage public URL (works in production + dev fallback)
  const bucketPath = isDec2025
    ? `past-papers-dec2025/${safeCode}.pdf`
    : `past-papers/${safeCode}/${filename}`;

  return NextResponse.redirect(supabasePublicUrl(bucketPath), { status: 302 });
}
