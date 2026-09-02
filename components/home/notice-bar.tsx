import Link from 'next/link';

export function NoticeBar({ locale }: { locale: 'zh' | 'kk' }) {
  const text = locale === 'kk'
    ? 'Жедел жәрдем · нөмірлерді бір рет басып көру'
    : '紧急求助 · 常用号码一键查看';

  return (
    <Link
      href="/emergency"
      className="flex items-center justify-center gap-2 h-9 text-sm font-medium text-white"
     style={{ backgroundColor: '#D9631A' }}
    >
      <span>⚠️</span>
      <span>{text}</span>
    </Link>
  );
}
