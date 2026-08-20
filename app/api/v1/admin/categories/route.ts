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

export const GET = withAdminAuth(async (_session: AdminSession) => {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
});

export const POST = withAdminAuth(async (session: AdminSession, request: NextRequest) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { slug, name, description, parent_id, sort_order, status } = body;

  if (!slug || !name) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'slug和name为必填项' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

  const { data, error } = await supabase
    .from('categories')
    .insert({
      slug,
      name,
      description: description ?? {},
      parent_id: parent_id ?? null,
      sort_order: sort_order ?? 0,
      status: status ?? 'active',
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

  return NextResponse.json({ success: true, data }, { status: 201 });
});