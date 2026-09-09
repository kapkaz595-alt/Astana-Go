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

// 获取某商家的点赞/点踩统计 + 当前访客是否已点过
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get('visitor_id');

  const supabase = await getClient();

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!merchant) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '商家不存在' } },
      { status: 404 }
    );
  }

  const { data: reactions } = await supabase
    .from('merchant_reactions')
    .select('reaction_type, visitor_id')
    .eq('merchant_id', merchant.id);

  const likeCount = (reactions || []).filter((r) => r.reaction_type === 'like').length;
  const dislikeCount = (reactions || []).filter((r) => r.reaction_type === 'dislike').length;
  const myReaction = visitorId
    ? (reactions || []).find((r) => r.visitor_id === visitorId)?.reaction_type ?? null
    : null;

  return NextResponse.json({
    success: true,
    data: { like_count: likeCount, dislike_count: dislikeCount, my_reaction: myReaction },
  });
}

// 提交点赞/点踩
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { visitor_id, reaction_type } = body;

  if (!visitor_id || !['like', 'dislike'].includes(reaction_type)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '参数错误' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!merchant) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '商家不存在' } },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from('merchant_reactions')
    .insert({ merchant_id: merchant.id, visitor_id, reaction_type });

  if (error) {
    // 唯一约束冲突 = 已经点过
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_REACTED', message: '您已经评价过该商家' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
