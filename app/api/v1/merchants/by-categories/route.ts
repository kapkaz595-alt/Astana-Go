import { NextRequest, NextResponse } from 'next/server';
import { isOpenNow } from '@/lib/utils/business-hours';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { pickLocaleField } from '@/lib/utils/i18n-fallback';
import { getCityId } from '@/lib/utils/city-cache';

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
  const locale = searchParams.get('locale') || 'zh';
  const citySlug = searchParams.get('city_slug') || 'astana';
  const perCategoryLimit = parseInt(searchParams.get('per_category_limit') || '10');

  const cityId = await getCityId(supabase, citySlug);

  if (!cityId) {
    return NextResponse.json({ success: true, data: {} });
  }

  // 一次性拿所有分类下的所有精选商家(数量不多,前端按分类分组后各自截取前N个)
  const { data, error } = await supabase
    .from('merchants')
    .select(
      `id, slug, name, cover_image, description, business_type, target_audiences,
      phone, whatsapp, address, latitude, longitude, "2gis_url", website, instagram,
      business_hours, verification_status, view_count, created_at, is_featured, price_range, location_note,
      merchant_categories(categories(id, slug, name))`
    )
    .eq('business_status', 'active')
    .eq('city_id', cityId)
    .eq('is_featured', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // 按分类slug分组,每组截取前perCategoryLimit条
  const grouped: Record<string, any[]> = {};

  for (const item of data || []) {
    const localized = {
      ...item,
      name: pickLocaleField(item.name as Record<string, string>, locale),
      description: pickLocaleField(item.description as Record<string, string>, locale),
      is_open_now: isOpenNow(item.business_hours as Record<string, { open: string; close: string }[]>),
    };

    for (const mc of (item.merchant_categories || []) as any[]) {
      const slug = mc.categories?.slug;
      if (!slug) continue;
      if (!grouped[slug]) grouped[slug] = [];
      if (grouped[slug].length < perCategoryLimit) {
        grouped[slug].push(localized);
      }
    }
  }

  return NextResponse.json({ success: true, data: grouped });
}
