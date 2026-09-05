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

// 获取某商家全部菜单项
export const GET = withAdminAuth(async (_session, _request, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('merchant_menu_items')
    .select('*')
    .eq('merchant_id', id)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});

// 新增菜单项
export const POST = withAdminAuth(async (_session, request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const supabase = await getClient();
  const body = await request.json();

  const { name, price, image_url, category, sort_order, detail } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: { message: 'name必填' } }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('merchant_menu_items')
    .insert({
      merchant_id: id,
      name,
      price: price ?? null,
      image_url: image_url ?? null,
      category: category ?? null,
      sort_order: sort_order ?? 0,
      detail: detail ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});
