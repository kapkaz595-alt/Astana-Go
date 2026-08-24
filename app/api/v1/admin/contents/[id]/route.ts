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

// GET 详情(含所有语言translations + 关联分类)
export const GET = withAdminAuth(async (
  _session: AdminSession,
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  const { id } = await context.params;
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('contents')
    .select('*, content_translations(*), content_categories(category_id)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '内容不存在' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
});

// PATCH 更新
export const PATCH = withAdminAuth(async (
  session: AdminSession,
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const { slug, content_type, status, cover_image, translations, category_ids } = body;

  const updateData: Record<string, unknown> = {};
  if (slug !== undefined) updateData.slug = slug;
  if (content_type !== undefined) updateData.content_type = content_type;
  if (cover_image !== undefined) updateData.cover_image = cover_image;
  if (status !== undefined) {
    updateData.status = status;
    // 状态变为published且之前未设置published_at时自动记录发布时间
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
  }

  const supabase = await getClient();

  let content;
  if (Object.keys(updateData).length > 0) {
    const { data, error } = await supabase
      .from('contents')
      .update(updateData)
      .eq('id', id)
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
    content = data;
  }

  if (!content) {
    const { data } = await supabase.from('contents').select().eq('id', id).single();
    content = data;
  }

  if (!content) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '内容不存在' } },
      { status: 404 }
    );
  }

  // upsert translations(按content_id+locale更新或新增,不影响其他语言)
  if (Array.isArray(translations) && translations.length > 0) {
    for (const t of translations) {
      if (!t.locale || !t.title || !t.body) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_INPUT', message: '每条translation需包含locale/title/body' } },
          { status: 400 }
        );
      }
    }

    const rows = translations.map((t: { locale: string; title: string; body: string; meta_description?: string; meta_title?: string }) => ({
  content_id: id,
  locale: t.locale,
  title: t.title,
  body: t.body,
  meta_description: t.meta_description ?? null,
  meta_title: t.meta_title ?? null,
}));

    const { error: transError } = await supabase
      .from('content_translations')
      .upsert(rows, { onConflict: 'content_id,locale' });

    if (transError) {
      return NextResponse.json(
        { success: false, error: { code: 'TRANSLATION_ERROR', message: transError.message } },
        { status: 500 }
      );
    }
  }

  // category_ids传了就整体替换(分类关系本身是轻量标签,替换合理)
  if (Array.isArray(category_ids)) {
    await supabase.from('content_categories').delete().eq('content_id', id);
    if (category_ids.length > 0) {
      const rels = category_ids.map((cid: string) => ({ content_id: id, category_id: cid }));
      const { error: relError } = await supabase.from('content_categories').insert(rels);
      if (relError) {
        return NextResponse.json(
          { success: false, error: { code: 'CATEGORY_LINK_ERROR', message: relError.message } },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true, data: content });
});

// DELETE 删除(translations因外键CASCADE自动删除,categories手动清理保险)
export const DELETE = withAdminAuth(async (
  session: AdminSession,
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  if (!requireAdminRole(session, ['super_admin'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '仅超级管理员可删除内容' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const supabase = await getClient();

  await supabase.from('content_categories').delete().eq('content_id', id);

  const { error } = await supabase.from('contents').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
});