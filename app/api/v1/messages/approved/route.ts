import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await getClient();
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '20');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('user_messages')
    .select('id, content, nickname, created_at, like_count')
    .eq('status', 'approved')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  const ids = (data ?? []).map((m) => m.id);
  let repliesByParent: Record<string, any[]> = {};

  if (ids.length > 0) {
    const { data: replies } = await supabase
      .from('user_messages')
      .select('id, content, nickname, created_at, like_count, parent_id')
      .eq('status', 'approved')
      .in('parent_id', ids)
      .order('created_at', { ascending: true });

    (replies ?? []).forEach((r) => {
      if (!repliesByParent[r.parent_id]) repliesByParent[r.parent_id] = [];
      repliesByParent[r.parent_id].push(r);
    });
  }

  const result = (data ?? []).map((m) => ({
    ...m,
    replies: repliesByParent[m.id] ?? [],
  }));

  return NextResponse.json({ success: true, data: result });
}
