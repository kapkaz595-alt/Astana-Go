import { NextResponse } from 'next/server';
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

export const GET = withAdminAuth(async (_session) => {
  const supabase = await getClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [todayRes, weekRes, monthRes, totalRes] = await Promise.all([
    supabase.from('page_views').select('visitor_id', { count: 'exact' }).gte('created_at', todayStart),
    supabase.from('page_views').select('visitor_id', { count: 'exact' }).gte('created_at', weekStart),
    supabase.from('page_views').select('visitor_id', { count: 'exact' }).gte('created_at', monthStart),
    supabase.from('page_views').select('visitor_id', { count: 'exact' }),
  ]);

  function uniqueVisitors(rows: any[] | null) {
    if (!rows) return 0;
    return new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;
  }

  return NextResponse.json({
    success: true,
    data: {
      today_views: todayRes.count ?? 0,
      today_visitors: uniqueVisitors(todayRes.data),
      week_views: weekRes.count ?? 0,
      week_visitors: uniqueVisitors(weekRes.data),
      month_views: monthRes.count ?? 0,
      month_visitors: uniqueVisitors(monthRes.data),
      total_views: totalRes.count ?? 0,
      total_visitors: uniqueVisitors(totalRes.data),
    },
  });
});
