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

export const GET = withAdminAuth(async (
  _session: AdminSession,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '分类不存在' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
});

export const PATCH = withAdminAuth(async (
  session: AdminSession,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json();
  const { slug, name, description, parent_id, sort_order, status } = body;

  const updateData: Record<string, unknown> = {};
  if (slug !== undefined) updateData.slug = slug;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (parent_id !== undefined) updateData.parent_id = parent_id;
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (status !== undefined) updateData.status = status;

  const supabase = await getClient();

  const { data, error } = await supabase
    .from('categories')
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

  if (!data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '分类不存在' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
});

export const DELETE = withAdminAuth(async (
  session: AdminSession,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  if (!requireAdminRole(session, ['super_admin'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '仅超级管理员可删除分类' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const supabase = await getClient();

  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id);

  if (count && count > 0) {
    return NextResponse.json(
      { success: false, error: { code: 'HAS_CHILDREN', message: '存在子分类，无法删除' } },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
});