import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: '邮箱和密码不能为空' } },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' } },
      { status: 401 }
    );
  }

  const { data: adminUser, error: dbError } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !adminUser || !adminUser.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ADMIN', message: '该账号无管理员权限' } },
      { status: 403 }
    );
  }

  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminUser.id);

  return NextResponse.json({
    success: true,
    data: { id: adminUser.id, email: adminUser.email, role: adminUser.role },
  });
}