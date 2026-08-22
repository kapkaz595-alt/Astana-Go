import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withAdminAuth, requireAdminRole } from '@/lib/supabase/admin-auth-middleware';
import type { AdminSession } from '@/lib/supabase/admin-session';

async function getClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    }
  );
}

// GET 列表:支持分页、content_type/status筛选
export const GET = withAdminAuth(async (_session: AdminSession, request: NextRequest) => {
  const supabase = await getClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '20');
  const contentType = searchParams.get('content_type');
  const status = searchParams.get('status');

  let query = supabase
    .from('contents')
    .select('*, content_translations(id, locale, title), content_categories(category_id)', { count: 'exact' });

  if (contentType) query = query.eq('content_type', contentType);
  if (status) query = query.eq('status', status);

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

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, page_size: pageSize, total: count || 0 },
  });
});

// POST 创建内容
export const POST = withAdminAuth(async (session: AdminSession, request: NextRequest) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    slug, content_type, status, cover_image,
    translations, // [{ locale, title, body, meta_description }]
    category_ids,
  } = body;

  if (!slug || !content_type) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'slug和content_type为必填项' } },
      { status: 400 }
    );
  }

  if (!Array.isArray(translations) || translations.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '至少需要一条translations(locale/title/body)' } },
      { status: 400 }
    );
  }

  for (const t of translations) {
    if (!t.locale || !t.title || !t.body) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: '每条translation需包含locale/title/body' } },
        { status: 400 }
      );
    }
  }

  const supabase = await getClient();

  const { data: content, error } = await supabase
    .from('contents')
    .insert({
      slug,
      content_type,
      status: status ?? 'draft',
      cover_image: cover_image ?? null,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_SLUG', message: '该slug已存在' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // 写入多语言translations
  const translationRows = translations.map((t: { locale: string; title: string; body: string; meta_description?: string }) => ({
    content_id: content.id,
    locale: t.locale,
    title: t.title,
    body: t.body,
    meta_description: t.meta_description ?? null,
  }));

  const { error: transError } = await supabase.from('content_translations').insert(translationRows);
  if (transError) {
    return NextResponse.json(
      { success: false, error: { code: 'TRANSLATION_ERROR', message: transError.message } },
      { status: 500 }
    );
  }

  // 写入分类关联
  if (Array.isArray(category_ids) && category_ids.length > 0) {
    const rels = category_ids.map((cid: string) => ({ content_id: content.id, category_id: cid }));
    const { error: relError } = await supabase.from('content_categories').insert(rels);
    if (relError) {
      return NextResponse.json(
        { success: false, error: { code: 'CATEGORY_LINK_ERROR', message: relError.message } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, data: content }, { status: 201 });
});