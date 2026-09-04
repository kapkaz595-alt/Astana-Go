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

export const PATCH = withAdminAuth(async (_session, request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const supabase = await getClient();
  const body = await request.json();

  const { name, phone_number, icon, sort_order, is_active } = body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone_number !== undefined) updateData.phone_number = phone_number;
  if (icon !== undefined) updateData.icon = icon;
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from('emergency_numbers')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
});

export const DELETE = withAdminAuth(async (_session, _request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const supabase = await getClient();

  const { error } = await supabase
    .from('emergency_numbers')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
  return NextResponse.json({ success: true });
});
