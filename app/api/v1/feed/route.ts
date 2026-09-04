import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isOpenNow } from '@/lib/utils/business-hours';

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
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '6');
  const category = searchParams.get('category');

  const supabase = await getClient();

  let filteredIds: string[] | null = null;
    if (category) {
      const { data: cat } = await supabase
        .from('local_pick_categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (!cat) {
        return NextResponse.json({ success: true, data: [], pagination: { page, page_size: pageSize, total: 0, has_more: false } });
      }

      const { data: rels } = await supabase
        .from('content_local_pick_categories')
        .select('content_id')
        .eq('category_id', cat.id);

      filteredIds = (rels ?? []).map(r => r.content_id);
      if (filteredIds.length === 0) {
        return NextResponse.json({ success: true, data: [], pagination: { page, page_size: pageSize, total: 0, has_more: false } });
      }
    }

  let query = supabase
      .from('contents')
      .select('id, slug, cover_image, published_at, content_type, content_translations(locale, title)')
      .eq('status', 'published');

    if (filteredIds) {
      query = query.in('id', filteredIds);
    }

    const { data: contents } = await query.order('published_at', { ascending: false });

  const contentItems = (contents ?? []).map((c) => ({
    type: 'content' as const,
    id: c.id,
    slug: c.slug,
    title: c.content_translations?.find((t: { locale: string }) => t.locale === 'zh')?.title ?? '',
    cover_image: c.cover_image,
    content_type: c.content_type,
    published_at: c.published_at,
  }));

  const merged = contentItems;

  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const pageItems = merged.slice(from, to);

  return NextResponse.json({
    success: true,
    data: pageItems,
    pagination: { page, page_size: pageSize, total: merged.length, has_more: to < merged.length },
  });
}
