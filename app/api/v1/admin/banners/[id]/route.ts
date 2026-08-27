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
  const updateData: Record<string, unknown> = {};
  if (body.image_url !== undefined) updateData.image_url = body.image_url;
  if (body.link_url !== undefined) updateData.link_url = body.link_url;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  updateData.updated_at = new Date().toISOString();

  const supabase = await getClient();
  const { data, error } = await supabase
    .from('banners')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});

export const DELETE = withAdminAuth(async (
  session: AdminSession,
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  if (!requireAdminRole(session, ['super_admin'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '仅超级管理员可删除广告' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const supabase = await getClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true });
});