import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export type AdminRole = 'super_admin' | 'editor' | 'viewer';

export interface AdminSession {
  id: string;
  email: string;
  role: AdminRole;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component 里可能无法写cookie，忽略即可
            // （只要中间件/Route Handler里能正常写，session就能续上）
          }
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: adminUser, error: dbError } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();

  if (dbError || !adminUser) return null;

  return {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  };
}
