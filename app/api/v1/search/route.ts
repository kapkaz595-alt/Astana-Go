import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

// 根据同义词表扩展搜索关键词集合
async function expandKeywords(supabase: Awaited<ReturnType<typeof getClient>>, keyword: string): Promise<string[]> {
  const terms = new Set<string>([keyword]);

  const [byTerm, bySynonym] = await Promise.all([
    supabase.from('search_synonyms').select('term, synonyms').eq('term', keyword),
    supabase.from('search_synonyms').select('term, synonyms').contains('synonyms', [keyword]),
  ]);

  const allRows = [...(byTerm.data || []), ...(bySynonym.data || [])];

  for (const row of allRows) {
    terms.add(row.term);
    for (const s of row.synonyms as string[]) terms.add(s);
  }

  return Array.from(terms);
}

// 判断某条文本命中了扩展词集合中的哪些词
function findMatchedTerms(text: string | null | undefined, terms: string[]): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t.toLowerCase()));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword')?.trim();
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 50);

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'keyword为必填参数' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();
  const terms = await expandKeywords(supabase, keyword);
  const orFilter = terms.map((t) => `search_text.ilike.%${t}%`).join(',');

  // 搜索商家
  const { data: merchants, error: merchantError } = await supabase
    .from('merchants')
    .select('id, slug, name, description, business_type, view_count, created_at, verification_status, business_hours, search_text')
    .eq('business_status', 'active')
    .or(orFilter);

  if (merchantError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: merchantError.message } },
      { status: 500 }
    );
  }

  // 搜索内容
  const contentOrFilter = terms.map((t) => `title.ilike.%${t}%,body.ilike.%${t}%`).join(',');
  const { data: translationMatches, error: contentError } = await supabase
    .from('content_translations')
    .select('content_id, locale, title, body, contents!inner(id, slug, content_type, status, cover_image, published_at)')
    .or(contentOrFilter)
    .eq('contents.status', 'published');

  if (contentError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: contentError.message } },
      { status: 500 }
    );
  }

  // 去重
  const seenContentIds = new Set<string>();
  const contents = (translationMatches || [])
    .filter((row) => {
      if (seenContentIds.has(row.content_id)) return false;
      seenContentIds.add(row.content_id);
      return true;
    })
    .map((row) => ({
      id: row.content_id,
      title: row.title,
      locale: row.locale,
      matched_terms: [...findMatchedTerms(row.title, terms), ...findMatchedTerms(row.body, terms)],
      ...row.contents,
    }));

  // 商家排序权重：已认证+营业中的排前面
  function merchantWeight(m: any): number {
    let w = 0;
    if (m.verification_status === 'verified') w += 100;
    w += Math.min(m.view_count ?? 0, 1000) / 10; // 浏览量加分，封顶100
    return w;
  }

  const merged = [
    ...(merchants || []).map((m) => ({
      type: 'merchant' as const,
      sort_date: (m as { created_at: string }).created_at,
      weight: merchantWeight(m),
      matched_terms: findMatchedTerms((m as any).search_text, terms),
      ...m,
    })),
    ...contents.map((c) => ({
      type: 'content' as const,
      sort_date: (c as { published_at?: string; created_at?: string }).published_at
        || (c as { published_at?: string; created_at?: string }).created_at
        || '',
      weight: 20, // 内容基础权重，介于普通商家和认证商家之间
      ...c,
    })),
  ].sort((a, b) => {
    // 先按权重降序，权重相同再按时间降序
    if (b.weight !== a.weight) return b.weight - a.weight;
    return new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime();
  });

  const total = merged.length;
  const from = (page - 1) * pageSize;
  const paged = merged.slice(from, from + pageSize);

  return NextResponse.json({
    success: true,
    data: paged,
    matched_terms: terms,
    pagination: { page, page_size: pageSize, total, has_more: from + pageSize < total },
  });
}
