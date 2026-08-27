import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/supabase/admin-session';
import LogoutButton from './logout-button';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: '概览' },
  { href: '/admin/dashboard/categories', label: '分类管理' },
  { href: '/admin/dashboard/merchants', label: '商家管理' },
  { href: '/admin/dashboard/contents', label: '内容管理' },
  { href: '/admin/banners', label: '广告管理' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-white">Astana Admin</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">
            {session.email} · <span className="text-slate-700">{session.role}</span>
          </div>
          <LogoutButton />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}