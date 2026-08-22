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
        setAll: () => {},
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