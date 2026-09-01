import { NextResponse } from 'next/server';
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

export const PATCH = withAdminAuth(async (session, request, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const supabase = await getClient();
  const { data, error } = await supabase
    .from('local_pick_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
});

export const DELETE = withAdminAuth(async (session, request, context: { params: Promise<Record<string, string>> }) => {
  const { id } = await context.params;
  const supabase = await getClient();
  const { error } = await supabase
    .from('local_pick_categories')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
});
