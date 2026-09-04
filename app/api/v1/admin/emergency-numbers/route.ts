import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withAdminAuth } from '@/lib/supabase/admin-auth-middleware';

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

// 获取全部（含未启用的，方便后台管理）
export const GET = withAdminAuth(async (_session, _request: NextRequest) => {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('emergency_numbers')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});

// 新增
export const POST = withAdminAuth(async (_session, request: NextRequest) => {
  const supabase = await getClient();
  const body = await request.json();

  const { name, phone_number, icon, sort_order, is_active } = body;

  if (!name || !phone_number) {
    return NextResponse.json({ success: false, error: { message: 'name和phone_number必填' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('emergency_numbers')
    .insert({
      name,
      phone_number,
      icon: icon ?? null,
      sort_order: sort_order ?? 0,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});
