import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import MerchantTabs from '@/components/merchant/merchant-tabs';

const UI_TEXT = {
  zh: { open: '营业中', closed: '已打烊', verified: '已认证' },
  kk: { open: 'Ашық', closed: 'Жабық', verified: 'Расталған' },
};

async function getMerchant(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/merchants/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  return res.json();
}

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getMerchant(slug);
  if (!result || !result.success) notFound();

  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value === 'kk' ? 'kk' : 'zh';
  const t = UI_TEXT[locale as 'zh' | 'kk'];

  const m = result.data;
  const name = m.name as Record<string, string>;
  const description = m.description as Record<string, string>;
  const businessHours = m.business_hours as Record<string, { open: string; close: string }[]>;

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center md:py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] md:max-w-[900px] w-full mx-auto md:shadow-2xl md:rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
        </header>

        <div className="px-[18px] pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full ${
              m.is_open_now ? 'bg-[#2E9E5B]/10 text-[#1D7A44]' : 'bg-[#B54B3A]/10 text-[#B54B3A]'
            }`}>
              {m.is_open_now ? t.open : t.closed}
            </span>
            {m.verification_status === 'verified' && (
              <span className="text-[10px] font-semibold text-[#2B8C93]">✓ {t.verified}</span>
            )}
          </div>

          <h1 className="text-xl font-extrabold" style={{ fontFamily: 'Manrope' }}>{name?.zh}</h1>
          <div className="text-sm text-[#6B7280] mt-1">{name?.ru} · {name?.kk}</div>
        </div>

        <MerchantTabs m={m} name={name} description={description} businessHours={businessHours} slug={slug} locale={locale} />
      </main>
    </div>
  );
}
