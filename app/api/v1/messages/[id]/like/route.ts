import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { device_id } = await req.json()
  const supabase = createClient()

  const { error } = await supabase
    .from('message_likes')
    .insert({ message_id: params.id, device_id })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '已经点过赞' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.rpc('increment_like_count', { msg_id: params.id })

  return NextResponse.json({ success: true })
}
