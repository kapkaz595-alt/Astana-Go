import Link from 'next/link';

export function NoticeBar() {
  return (
    <Link
      href="/emergency"
      className="flex items-center justify-center gap-2 h-9 text-sm font-medium text-white"
      style={{ backgroundColor: '#B54B3A' }}
    >
      <span>⚠️</span>
      <span>紧急求助 · 常用号码一键查看</span>
    </Link>
  );
}