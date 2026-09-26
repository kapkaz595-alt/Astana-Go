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
  { params }: { params: { id: string } }
) {
  const { device_id } = await request.json();
  const supabase = await getClient();

  const { error } = await supabase
    .from('message_likes')
    .insert({ message_id: params.id, device_id });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '已经点过赞' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc('increment_like_count', { msg_id: params.id });

  return NextResponse.json({ success: true });
}
