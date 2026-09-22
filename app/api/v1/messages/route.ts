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

export async function POST(request: NextRequest) {
  const supabase = await getClient();
  const { content, nickname } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '内容不能为空' } },
      { status: 400 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('user_messages')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', oneHourAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: '提交太频繁，请稍后再试' } },
      { status: 429 }
    );
  }

  const { error } = await supabase.from('user_messages').insert({
    content: content.trim().slice(0, 100),
    nickname: nickname?.trim().slice(0, 20) || '匿名用户',
    ip,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
