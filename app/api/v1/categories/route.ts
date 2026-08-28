import { NextRequest, NextResponse } from 'next/server';
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
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'zh';
  const sortField = locale === 'kk' ? 'sort_order_kk' : 'sort_order_zh';

  const supabase = await getClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, description, parent_id, sort_order, sort_order_zh, sort_order_kk, status, icon, icon_color')
    .eq('status', 'active')
    .order(sortField, { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true });

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
}));

return NextResponse.json({ success: true, data: responseData });
}