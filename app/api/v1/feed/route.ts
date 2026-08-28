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

  const supabase = await getClient();

  const { data: contents } = await supabase
  .from('contents')
  .select('id, slug, cover_image, published_at, content_type, content_translations(locale, title)')
  .eq('status', 'published')
  .order('published_at', { ascending: false });

  const contentItems = (contents ?? []).map((c) => ({
    type: 'content' as const,
    id: c.id,
    slug: c.slug,
    title: c.content_translations?.find((t: { locale: string }) => t.locale === 'zh')?.title ?? '',
    cover_image: c.cover_image,
    content_type: c.content_type,
    sort_date: c.published_at,
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