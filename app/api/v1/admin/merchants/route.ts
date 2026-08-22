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

// GET 列表:支持分页、business_type/status筛选、关键词搜索
export const GET = withAdminAuth(async (_session: AdminSession, request: NextRequest) => {
  const supabase = await getClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '20');
  const businessType = searchParams.get('business_type');
  const businessStatus = searchParams.get('business_status');
  const keyword = searchParams.get('keyword');
  const categoryId = searchParams.get('category_id');

  let query = supabase
    .from('merchants')
    .select('*, merchant_categories(category_id)', { count: 'exact' });

  if (businessType) query = query.eq('business_type', businessType);
  if (businessStatus) query = query.eq('business_status', businessStatus);
  if (keyword) query = query.ilike('search_text', `%${keyword}%`);
  if (categoryId) {
    query = query.eq('merchant_categories.category_id', categoryId);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, page_size: pageSize, total: count || 0 },
  });
});

// POST 创建商家
export const POST = withAdminAuth(async (session: AdminSession, request: NextRequest) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    slug, name, description, business_type, target_audiences,
    phone, whatsapp, address, latitude, longitude,
    '2gis_url': gisUrl, website, instagram,
    business_status, verification_status,
    category_ids, // 数组,用于写merchant_categories
  } = body;

  if (!slug || !name || !business_type) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'slug/name/business_type为必填项' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

 const { data: merchant, error } = await supabase
  .from('merchants')
  .insert({
    slug,
    name,
    description: description ?? {},
    business_type,
    target_audiences: target_audiences ?? [],
    phone: phone ?? null,
    whatsapp: whatsapp ?? null,
    address: address ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    '2gis_url': gisUrl ?? null,
    website: website ?? null,
    instagram: instagram ?? null,
    business_status: business_status ?? 'active',
    verification_status: verification_status ?? 'unverified',
    source_type: 'manual',
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

  // 写入分类关联
  if (Array.isArray(category_ids) && category_ids.length > 0) {
    const rows = category_ids.map((cid: string) => ({
      merchant_id: merchant.id,
      category_id: cid,
    }));
    const { error: relError } = await supabase.from('merchant_categories').insert(rows);
    if (relError) {
      return NextResponse.json(
        { success: false, error: { code: 'CATEGORY_LINK_ERROR', message: relError.message } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, data: merchant }, { status: 201 });
});