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

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'zh';
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('contents')
    .select(
    id, slug, content_type, cover_image, published_at, created_at, updated_at,
       content_translations(locale, title, body, meta_title, meta_description),
       content_categories(categories(id, slug, name))`
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '内容不存在' } },
      { status: 404 }
    );
  }

  const translation = pickTranslation(data.content_translations, locale);
const responseData = { ...data, translation };

return NextResponse.json({ success: true, data: responseData });
}
