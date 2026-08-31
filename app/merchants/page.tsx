import Link from 'next/link';

async function getMerchants(params: { filter?: string; category?: string; keyword?: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const qs = new URLSearchParams();
  if (params.category) qs.set('category_slug', params.category);
  if (params.keyword) qs.set('keyword', params.keyword);
  qs.set('page_size', '50');
  const res = await fetch(`${base}/api/v1/merchants?${qs.toString()}`, { cache: 'no-store' });
  return res.json();
}

type Merchant = {
  id: string; slug: string; name: string; cover_image?: string;
  view_count: number; verification_status: string; is_open_now: boolean;
};

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string; keyword?: string }>;
}) {
  const params = await searchParams;
  const result = await getMerchants(params);
  let items: Merchant[] = result?.data ?? [];

  if (params.filter === 'open') {
    items = items.filter((m) => m.is_open_now);
  }

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
          <div className="font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>
            {params.filter === 'open' ? '营业中的商家' : '全部商家'}
          </div>
        </header>

        <div className="px-[18px] pb-2 text-xs text-[#6B7280]">
          共 {items.length} 家商家
        </div>

        <div className="flex flex-col gap-3 px-[18px] pb-6">
          {items.length === 0 && (
            <div className="text-sm text-[#6B7280] py-10 text-center">暂无商家</div>
          )}
          {items.map((m) => (
           <Link
  key={m.id}
  href={`/merchants/${m.slug}`}
  className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center gap-3"
>
  {m.cover_image ? (
    <img src={m.cover_image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
  ) : (
    <div className="w-16 h-16 rounded-lg shrink-0 bg-gradient-to-br from-[#D9A441] to-[#2B8C93]" />
  )}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className={`text-[9px] font-bold px-[6px] py-[2px] rounded-full ${
        m.is_open_now ? 'bg-[#2E9E5B]/10 text-[#1D7A44]' : 'bg-[#B54B3A]/10 text-[#B54B3A]'
      }`}>
        {m.is_open_now ? '营业中' : '已打烊'}
      </span>
      <div className="text-sm font-bold truncate">{m.name}</div>
    </div>
    <div className="flex items-center gap-2 mt-[6px] text-[10px] text-[#6B7280] tabular-nums">
      <span>👁 {m.view_count}</span>
      {m.verification_status === 'verified' ? (
        <span className="text-[#2B8C93] font-semibold">✓ 已认证</span>
      ) : (
        <span className="text-[#B0B5BF]">○ 待认证</span>
      )}
    </div>
  </div>
</Link>
          ))}
        </div>
      </main>
    </div>
  );
}
