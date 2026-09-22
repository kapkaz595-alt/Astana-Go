import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { content, nickname } = await req.json();

  if (!content?.trim()) {
    return Response.json({ error: '内容不能为空' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('user_messages')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', oneHourAgo);

  if ((count ?? 0) >= 3) {
    return Response.json({ error: '提交太频繁，请稍后再试' }, { status: 429 });
  }

  const { error } = await supabase.from('user_messages').insert({
    content: content.trim().slice(0, 100),
    nickname: nickname?.trim().slice(0, 20) || '匿名用户',
    ip,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
