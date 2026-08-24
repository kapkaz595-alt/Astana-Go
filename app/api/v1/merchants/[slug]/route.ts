import { NextRequest, NextResponse } from 'next/server';
import { isOpenNow } from '@/lib/utils/business-hours';
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const { slug } = await context.params;
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('merchants')
    .select(
      `id, slug, name, description, business_type, target_audiences,
      phone, whatsapp, address, latitude, longitude, "2gis_url", website, instagram,
      business_hours, verification_status, view_count, created_at,
      merchant_categories(categories(id, slug, name))`
    )
    .eq('slug', slug)
    .eq('business_status', 'active')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '商家不存在' } },
      { status: 404 }
    );
  }

  // view_count异步自增：不await，不阻塞响应返回
  supabase.rpc('increment_merchant_view_count', { merchant_id: data.id }).then();

  const responseData = { ...data, is_open_now: isOpenNow(data.business_hours as Record<string, { open: string; close: string }[]>) };
  return NextResponse.json({ success: true, data: responseData });
}