import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = 'pdfs';

function safeCourseCode(code: string): string | null {
  const cleaned = code.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  return /^[A-Z0-9-]{3,12}$/.test(cleaned) ? cleaned : null;
}

function supabasePublicUrl(bucketPath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${bucketPath}`;
}

/**
 * GET /api/pdf/textbook/[courseCode]/url
 *
 * Returns the resolved public URL for the course textbook PDF so the client
 * can build its own `#page=N` fragment and embed it directly in an iframe src.
 * This avoids the browser dropping the fragment when following an HTTP 302 redirect.
 *
 * Response: { url: string }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseCode: string }> }
) {
  const { courseCode } = await params;
  const safeCode = safeCourseCode(courseCode);
  if (!safeCode) return new NextResponse('Bad Request', { status: 400 });

  // In dev: check if local file exists and return a local API URL
  if (process.env.NODE_ENV === 'development') {
    const localPath = path.join(
      process.cwd(), 'data', 'textbooks', safeCode, `${safeCode}_textbook.pdf`
    );
    if (existsSync(localPath)) {
      return NextResponse.json({
        url: `/api/pdf/textbook/${safeCode}`,
      });
    }
  }

  // Production: query Supabase storage to find the exact filename
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const listUrl = `${supabaseUrl}/storage/v1/object/list/pdfs`;
    const res = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey ?? anonKey}`,
      },
      body: JSON.stringify({ prefix: `textbooks/${safeCode}/`, limit: 10 }),
    });

    if (res.ok) {
      const files = await res.json();
      if (Array.isArray(files) && files.length > 0) {
        // Prefer the combined _textbook.pdf
        const combined = files.find(
          (f) => f.name && (f.name.toLowerCase().includes('_textbook') || f.name.endsWith('.pdf'))
        );
        const pdfFile = combined ?? files.find((f) => f.name?.endsWith('.pdf'));
        if (pdfFile) {
          return NextResponse.json({
            url: supabasePublicUrl(`textbooks/${safeCode}/${pdfFile.name}`),
          });
        }
      }
    }
  } catch (err) {
    console.error('[textbook/url] Failed to resolve URL for', safeCode, err);
  }

  // Fallback to standard naming convention
  return NextResponse.json({
    url: supabasePublicUrl(`textbooks/${safeCode}/${safeCode}_textbook.pdf`),
  });
}
