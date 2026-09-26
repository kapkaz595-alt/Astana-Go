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
  try {
    const { id } = await params;
    const { device_id } = await request.json();
    const supabase = await getClient();

    const { error } = await supabase
      .from('message_likes')
      .insert({ message_id: id, device_id });

    if (error) {
      return NextResponse.json({ error: 'INSERT_ERROR: ' + error.message, code: error.code }, { status: 500 });
    }

    const { error: rpcError } = await supabase.rpc('increment_like_count', { msg_id: id });

    if (rpcError) {
      return NextResponse.json({ error: 'RPC_ERROR: ' + rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'CATCH_ERROR: ' + e.message }, { status: 500 });
  }
}
