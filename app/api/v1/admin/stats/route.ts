import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withAdminAuth } from '@/lib/supabase/admin-auth-middleware';

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

export const GET = withAdminAuth(async (_session, _request: NextRequest) => {
  const supabase = await getClient();

  const [
    { count: categoryCount },
    { count: merchantCount },
    { count: activeMerchantCount },
    { count: verifiedMerchantCount },
    { count: featuredMerchantCount },
    { count: contentCount },
    { count: menuItemCount },
    { data: merchants },
    { count: phoneClicks },
    { count: whatsappClicks },
    { count: gisClicks },
    { data: topViewed },
    { data: clickEvents },
  ] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('merchants').select('*', { count: 'exact', head: true }),
    supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('business_status', 'active'),
    supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('contents').select('*', { count: 'exact', head: true }),
    supabase.from('merchant_menu_items').select('*', { count: 'exact', head: true }),
    supabase.from('merchants').select('view_count'),
    supabase.from('merchant_click_events').select('*', { count: 'exact', head: true }).eq('event_type', 'phone'),
    supabase.from('merchant_click_events').select('*', { count: 'exact', head: true }).eq('event_type', 'whatsapp'),
    supabase.from('merchant_click_events').select('*', { count: 'exact', head: true }).eq('event_type', '2gis'),
    supabase.from('merchants').select('id, name, view_count').order('view_count', { ascending: false }).limit(10),
    supabase.from('merchant_click_events').select('merchant_id, event_type'),
  ]);

  const totalViews = (merchants ?? []).reduce((sum, m) => sum + (m.view_count ?? 0), 0);

  // 按商家聚合点击数，排出Top10转化榜
  const clickCountByMerchant: Record<string, number> = {};
  for (const e of clickEvents ?? []) {
    clickCountByMerchant[e.merchant_id] = (clickCountByMerchant[e.merchant_id] ?? 0) + 1;
  }
  const topMerchantIds = Object.entries(clickCountByMerchant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  let topConverted: { id: string; name: any; clicks: number }[] = [];
  if (topMerchantIds.length > 0) {
    const { data: topMerchantNames } = await supabase
      .from('merchants')
      .select('id, name')
      .in('id', topMerchantIds);
    topConverted = topMerchantIds.map((id) => ({
      id,
      name: topMerchantNames?.find((m) => m.id === id)?.name,
      clicks: clickCountByMerchant[id],
    }));
  }

  return NextResponse.json({
    success: true,
    data: {
      categoryCount: categoryCount ?? 0,
      merchantCount: merchantCount ?? 0,
      activeMerchantCount: activeMerchantCount ?? 0,
      verifiedMerchantCount: verifiedMerchantCount ?? 0,
      featuredMerchantCount: featuredMerchantCount ?? 0,
      contentCount: contentCount ?? 0,
      menuItemCount: menuItemCount ?? 0,
      totalViews,
      phoneClicks: phoneClicks ?? 0,
      whatsappClicks: whatsappClicks ?? 0,
      gisClicks: gisClicks ?? 0,
      topViewed: topViewed ?? [],
      topConverted,
    },
  });
});
