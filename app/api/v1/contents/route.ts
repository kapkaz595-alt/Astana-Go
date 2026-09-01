import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { pickTranslation } from '@/lib/utils/i18n-fallback';

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
  const localPickCategory = searchParams.get('local_pick_category');

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 50);
  const contentType = searchParams.get('content_type');
  const tag = searchParams.get('tag');
  const locale = searchParams.get('locale') || 'zh';

  let query = supabase
    .from('contents')
    .select(
      `id, slug, content_type, cover_image, published_at, created_at,
       content_translations(locale, title, meta_description),
       content_categories(categories(id, slug, name))`,
      { count: 'exact' }
    )
    .eq('status', 'published');

  let filteredIds: string[] | null = null;
    if (localPickCategory) {
      const { data: cat } = await supabase
        .from('local_pick_categories')
        .select('id')
        .eq('slug', localPickCategory)
        .single();

      if (!cat) {
        return NextResponse.json({ success: true, data: [], meta: { requested_locale: locale }, pagination: { page, page_size: pageSize, total: 0 } });
      }

      const { data: rels } = await supabase
        .from('content_local_pick_categories')
        .select('content_id')
        .eq('category_id', cat.id);

      filteredIds = (rels ?? []).map(r => r.content_id);
      if (filteredIds.length === 0) {
        return NextResponse.json({ success: true, data: [], meta: { requested_locale: locale }, pagination: { page, page_size: pageSize, total: 0 } });
      }
    }

  if (contentType) query = query.eq('content_type', contentType);
  if (tag) query = query.eq('topic_tag', tag);
  if (filteredIds) query = query.in('id', filteredIds);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  const responseData = (data || []).map((item) => ({
    ...item,
    translation: pickTranslation(item.content_translations, locale),
  }));

  return NextResponse.json({
    success: true,
    data: responseData,
    meta: { requested_locale: locale },
    pagination: { page, page_size: pageSize, total: count || 0 },
  });
}
