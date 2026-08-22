'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
    >
      退出登录
    </button>
  );
}