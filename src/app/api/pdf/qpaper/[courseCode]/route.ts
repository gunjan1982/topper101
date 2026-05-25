import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';

function safeCourseCode(code: string): string | null {
  const cleaned = code.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  return /^[A-Z0-9-]{3,12}$/.test(cleaned) ? cleaned : null;
}

function serveFile(filePath: string, request: NextRequest): NextResponse {
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
      'Cache-Control': 'public, max-age=3600',
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

  // Primary: data/past_papers/{code}/{code}_{session}_{year}.pdf
  const primary = path.join(dataDir, 'past_papers', safeCode, `${safeCode}_${session}_${year}.pdf`);
  if (existsSync(primary)) return serveFile(primary, request);

  // Fallback: data/past_papers_dec2025/{code}.pdf
  if (year === '2025' && session === 'December') {
    const dec2025 = path.join(dataDir, 'past_papers_dec2025', `${safeCode}.pdf`);
    if (existsSync(dec2025)) return serveFile(dec2025, request);
  }

  return new NextResponse('Not Found', { status: 404 });
}
