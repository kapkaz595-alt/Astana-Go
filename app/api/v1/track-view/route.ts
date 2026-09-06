import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await getClient();
  const body = await request.json();
  const { page_path, visitor_id } = body;

  await supabase.from('page_views').insert({
    page_path: page_path || '/',
    visitor_id: visitor_id || null,
    user_agent: request.headers.get('user-agent') || null,
  });

  return NextResponse.json({ success: true });
}
