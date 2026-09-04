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
  context: { params: Promise<Record<string, string>> }
) {
  const { slug } = await context.params;
  const supabase = await getClient();
  const { event_type } = await request.json();

  if (!['phone', 'whatsapp', '2gis', 'gallery'].includes(event_type)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!merchant) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  await supabase.from('merchant_click_events').insert({
    merchant_id: merchant.id,
    event_type,
  });

  return NextResponse.json({ success: true });
}
