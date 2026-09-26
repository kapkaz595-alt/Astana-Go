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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content, nickname, device_id } = await request.json();
  const finalNickname = nickname || `游客${(device_id || '').slice(-6)}`;
  if (!content || !content.trim()) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID', message: '内容不能为空' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

  const { error } = await supabase.from('user_messages').insert({
    content,
    nickname: finalNickname,
    parent_id: id,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
