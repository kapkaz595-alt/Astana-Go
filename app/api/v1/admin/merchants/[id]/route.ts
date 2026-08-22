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

// GET 单条详情(含关联分类)
export const GET = withAdminAuth(async (
  _session: AdminSession,
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  const { id } = await context.params;
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('merchants')
    .select('*, merchant_categories(category_id)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '商家不存在' } },
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
  const {
    slug, name, description, business_type, target_audiences,
    phone, whatsapp, address, latitude, longitude,
    '2gis_url': gisUrl, website, instagram,
    business_status, verification_status,
    category_ids,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (slug !== undefined) updateData.slug = slug;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (business_type !== undefined) updateData.business_type = business_type;
  if (target_audiences !== undefined) updateData.target_audiences = target_audiences;
  if (phone !== undefined) updateData.phone = phone;
  if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
  if (address !== undefined) updateData.address = address;
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (gisUrl !== undefined) updateData['2gis_url'] = gisUrl;
  if (website !== undefined) updateData.website = website;
  if (instagram !== undefined) updateData.instagram = instagram;
  if (business_status !== undefined) updateData.business_status = business_status;
  if (verification_status !== undefined) updateData.verification_status = verification_status;

  const supabase = await getClient();

  const { data, error } = await supabase
    .from('merchants')
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
      { success: false, error: { code: 'NOT_FOUND', message: '商家不存在' } },
      { status: 404 }
    );
  }

  // 如果传了category_ids,先清空旧关联再插入新的
  if (Array.isArray(category_ids)) {
    const { error: delError } = await supabase
      .from('merchant_categories')
      .delete()
      .eq('merchant_id', id);

    if (delError) {
      return NextResponse.json(
        { success: false, error: { code: 'CATEGORY_LINK_ERROR', message: delError.message } },
        { status: 500 }
      );
    }

    if (category_ids.length > 0) {
      const rows = category_ids.map((cid: string) => ({
        merchant_id: id,
        category_id: cid,
      }));
      const { error: insError } = await supabase.from('merchant_categories').insert(rows);
      if (insError) {
        return NextResponse.json(
          { success: false, error: { code: 'CATEGORY_LINK_ERROR', message: insError.message } },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true, data });
});

// DELETE 删除
export const DELETE = withAdminAuth(async (
  session: AdminSession,
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  if (!requireAdminRole(session, ['super_admin'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '仅超级管理员可删除商家' } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const supabase = await getClient();

  // merchant_categories关联记录先删(避免外键约束报错)
  await supabase.from('merchant_categories').delete().eq('merchant_id', id);

  const { error } = await supabase.from('merchants').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
});