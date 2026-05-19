import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type PageviewPayload = {
  anonymousId?: string;
  path?: string;
  url?: string;
  referrer?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PageviewPayload;
    const path = payload.path?.trim();

    if (!path || path.startsWith('/api/')) {
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();

    await admin.from('page_events').insert({
      user_id: user?.id ?? null,
      anonymous_id: payload.anonymousId?.slice(0, 128) ?? null,
      path,
      url: payload.url?.slice(0, 1000) ?? null,
      referrer: payload.referrer?.slice(0, 1000) ?? null,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('[pageview]', error);
    return NextResponse.json({ ok: true });
  }
}
