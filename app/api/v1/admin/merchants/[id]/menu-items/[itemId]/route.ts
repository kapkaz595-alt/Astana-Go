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

// 更新菜单项
export const PATCH = withAdminAuth(async (_session, request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
  const { itemId } = await context.params;
  const supabase = await getClient();
  const body = await request.json();

  const { name, price, image_url, category, sort_order } = body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (category !== undefined) updateData.category = category;
  if (sort_order !== undefined) updateData.sort_order = sort_order;

  const { data, error } = await supabase
    .from('merchant_menu_items')
    .update(updateData)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});

// 删除菜单项
export const DELETE = withAdminAuth(async (_session, _request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
  const { itemId } = await context.params;
  const supabase = await getClient();

  const { error } = await supabase
    .from('merchant_menu_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true });
});
