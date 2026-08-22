import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withAdminAuth } from '@/lib/supabase/admin-auth-middleware';
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

const ALLOWED_FOLDERS = ['merchants', 'contents', 'categories'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withAdminAuth(async (_session: AdminSession, request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const folder = formData.get('folder') as string | null;
  const entityId = formData.get('entity_id') as string | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '未上传文件' } },
      { status: 400 }
    );
  }

  if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: `folder必须是: ${ALLOWED_FOLDERS.join('/')}` } },
      { status: 400 }
    );
  }

  if (!entityId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'entity_id为必填项' } },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_FILE_TYPE', message: '仅支持jpeg/png/webp/gif格式' } },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: { code: 'FILE_TOO_LARGE', message: '文件大小不能超过5MB' } },
      { status: 400 }
    );
  }

  const supabase = await getClient();

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${entityId}/${fileName}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UPLOAD_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

  return NextResponse.json({
    success: true,
    data: { path, url: urlData.publicUrl },
  }, { status: 201 });
});