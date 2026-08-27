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

export const GET = withAdminAuth(async (_session: AdminSession, _request: NextRequest) => {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
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
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('banners')
    .insert({
      position: body.position ?? 'homepage_top',
      image_url: body.image_url,
      link_url: body.link_url ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});