import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parse } from 'csv-parse/sync';
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

interface CsvRow {
  slug: string;
  name_zh?: string;
  name_kk?: string;
  name_ru?: string;
  description_zh?: string;
  description_kk?: string;
  description_ru?: string;
  business_type: string;
  target_audiences?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  '2gis_url'?: string;
  website?: string;
  instagram?: string;
  category_slugs?: string;
}

interface ImportError {
  row: number;
  slug: string;
  message: string;
}

export const POST = withAdminAuth(async (session: AdminSession, request: NextRequest) => {
  if (!requireAdminRole(session, ['super_admin', 'editor'])) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '权限不足' } },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '未上传文件' } },
      { status: 400 }
    );
  }

  const text = await file.text();
  let rows: CsvRow[];
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { code: 'CSV_PARSE_ERROR', message: 'CSV格式解析失败: ' + (e as Error).message } },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'CSV文件为空' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

  // 预先加载所有分类slug->id映射
  const { data: allCategories } = await supabase.from('categories').select('id, slug');
  const categoryMap = new Map((allCategories || []).map((c) => [c.slug, c.id]));

  const errors: ImportError[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // CSV第1行是表头,数据从第2行开始

    if (!row.slug || !row.business_type) {
      errors.push({ row: rowNum, slug: row.slug || '(空)', message: 'slug和business_type为必填项' });
      continue;
    }

    if (!['local_merchant', 'business_service'].includes(row.business_type)) {
      errors.push({ row: rowNum, slug: row.slug, message: `business_type取值无效: ${row.business_type}` });
      continue;
    }

    const name: Record<string, string> = {};
    if (row.name_zh) name.zh = row.name_zh;
    if (row.name_kk) name.kk = row.name_kk;
    if (row.name_ru) name.ru = row.name_ru;

    if (Object.keys(name).length === 0) {
      errors.push({ row: rowNum, slug: row.slug, message: '至少需要一种语言的name' });
      continue;
    }

    const description: Record<string, string> = {};
    if (row.description_zh) description.zh = row.description_zh;
    if (row.description_kk) description.kk = row.description_kk;
    if (row.description_ru) description.ru = row.description_ru;

    const target_audiences = row.target_audiences
      ? row.target_audiences.split(';').map((s) => s.trim()).filter(Boolean)
      : [];

    const { data: merchant, error: insertError } = await supabase
      .from('merchants')
      .insert({
        slug: row.slug,
        name,
        description,
        business_type: row.business_type,
        target_audiences,
        phone: row.phone || null,
        whatsapp: row.whatsapp || null,
        address: row.address || null,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        '2gis_url': row['2gis_url'] || null,
        website: row.website || null,
        instagram: row.instagram || null,
        source_type: 'batch_import',
      })
      .select('id')
      .single();

    if (insertError) {
      const msg = insertError.code === '23505' ? 'slug已存在' : insertError.message;
      errors.push({ row: rowNum, slug: row.slug, message: msg });
      continue;
    }

    // 处理分类关联
    if (row.category_slugs) {
      const slugs = row.category_slugs.split(';').map((s) => s.trim()).filter(Boolean);
      const categoryIds = slugs
        .map((s) => categoryMap.get(s))
        .filter((id): id is string => Boolean(id));

      if (categoryIds.length > 0) {
        const rels = categoryIds.map((cid) => ({ merchant_id: merchant.id, category_id: cid }));
        await supabase.from('merchant_categories').insert(rels);
      }
    }

    imported++;
  }

  return NextResponse.json({
    success: true,
    data: {
      total: rows.length,
      imported,
      failed: errors.length,
      errors,
    },
  });
});