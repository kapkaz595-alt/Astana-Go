import { NextRequest, NextResponse } from 'next/server';
import { isOpenNow } from '@/lib/utils/business-hours';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { pickLocaleField } from '@/lib/utils/i18n-fallback';

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

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 50);
  const businessType = searchParams.get('business_type');
  const keyword = searchParams.get('keyword');
  const categorySlug = searchParams.get('category_slug');
  const featured = searchParams.get('featured');
  const locale = searchParams.get('locale') || 'zh';

  let query = supabase
    .from('merchants')
    .select(
  `id, slug, name, cover_image, description, business_type, target_audiences,
  phone, whatsapp, address, latitude, longitude, "2gis_url", website, instagram,
  business_hours, verification_status, view_count, created_at, is_featured,
  merchant_categories(categories(id, slug, name))`,
  { count: 'exact' }
)
    .eq('business_status', 'active');
  
  if (featured === 'true') query = query.eq('is_featured', true);
  if (businessType) query = query.eq('business_type', businessType);
  if (keyword) query = query.ilike('search_text', `%${keyword}%`);
  

  if (categorySlug) {
    // 先按slug查category_id，再筛选
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (!cat) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, page_size: pageSize, total: 0 },
      });
    }

    const { data: relations } = await supabase
      .from('merchant_categories')
      .select('merchant_id')
      .eq('category_id', cat.id);

    const merchantIds = (relations ?? []).map((r) => r.merchant_id);

    if (merchantIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, page_size: pageSize, total: 0 },
      });
    }

    query = query.in('id', merchantIds);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  const responseData = (data || []).map((item) => ({
  ...item,
  name: pickLocaleField(item.name as Record<string, string>, locale),
  description: pickLocaleField(item.description as Record<string, string>, locale),
  merchant_categories: (item.merchant_categories || []).map((mc: any) => ({
    ...mc,
    categories: mc.categories
      ? { ...mc.categories, name: pickLocaleField(mc.categories.name as Record<string, string>, locale) }
      : mc.categories,
  })),
  is_open_now: isOpenNow(item.business_hours as Record<string, { open: string; close: string }[]>),
}));

return NextResponse.json({
  success: true,
  data: responseData,
  pagination: { page, page_size: pageSize, total: count || 0 },
});
}
