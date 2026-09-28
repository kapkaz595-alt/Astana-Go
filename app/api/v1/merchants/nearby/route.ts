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

  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radius = Math.min(parseFloat(searchParams.get('radius') || '3000'), 50000);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const categorySlug = searchParams.get('category_slug');
  const locale = searchParams.get('locale') || 'zh';
  const citySlug = searchParams.get('city_slug') || 'astana';

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '缺少或无效的 lat/lng' } },
      { status: 400 }
    );
  }

  const empty = NextResponse.json({ success: true, data: [], total: 0 });

  const cityId = await getCityId(supabase, citySlug);
  if (!cityId) return empty;

  // 1. 数据库算距离，取最近的一批
  const { data: nearby, error: rpcError } = await supabase.rpc('nearby_merchants', {
    user_lat: lat,
    user_lng: lng,
    radius_m: radius,
    max_results: 200,
  });

  if (rpcError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: rpcError.message } },
      { status: 500 }
    );
  }

  const inRadius = (nearby ?? []).filter((n: any) => n.distance_m <= radius);
  if (inRadius.length === 0) return empty;

  const distanceMap = new Map<string, number>(
    inRadius.map((n: any) => [n.id as string, n.distance_m as number])
  );
  let ids: string[] = inRadius.map((n: any) => n.id as string);

  // 2. 可选：按分类筛选（两步查询法）
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (!cat) return empty;

    const { data: relations } = await supabase
      .from('merchant_categories')
      .select('merchant_id')
      .eq('category_id', cat.id)
      .in('merchant_id', ids);

    ids = (relations ?? []).map((r) => r.merchant_id as string);
    if (ids.length === 0) return empty;
  }

  // 3. 查商家详情（和列表接口字段一致，含城市隔离和营业状态）
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
    .in('id', ids);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  const responseData = (data || [])
    .map((item) => ({
      ...item,
      distance_m: Math.round(distanceMap.get(item.id) ?? 0),
      name: pickLocaleField(item.name as Record<string, string>, locale),
      description: pickLocaleField(item.description as Record<string, string>, locale),
      merchant_categories: (item.merchant_categories || []).map((mc: any) => ({
        ...mc,
        categories: mc.categories
          ? { ...mc.categories, name: pickLocaleField(mc.categories.name as Record<string, string>, locale) }
          : mc.categories,
      })),
      is_open_now: isOpenNow(
        item.business_hours as Record<string, { open: string; close: string }[]>
      ),
    }))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, limit);

  return NextResponse.json({ success: true, data: responseData, total: responseData.length });
}
