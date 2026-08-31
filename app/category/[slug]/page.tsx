type Merchant = {
  id: string;
  slug: string;
  name: Record<string, string>;
  view_count: number;
  verification_status: string;
  is_open_now: boolean;
  cover_image: string | null;
  price_range: string | null;
};

type Category = {
  id: string;
  slug: string;
  name: Record<string, string>;
  icon: string | null;
  icon_color: string | null;
};

async function getCategory(slug: string): Promise<Category | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/v1/categories`, { cache: 'no-store' });
  const data = await res.json();
  const list: Category[] = data.data ?? [];
  return list.find((c) => c.slug === slug) ?? null;
}

async function getMerchants(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/v1/merchants?category_slug=${slug}&page_size=50`,
    { cache: 'no-store' }
  );
  const data = await res.json();
  return (data.data ?? []) as Merchant[];
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, merchants] = await Promise.all([getCategory(slug), getMerchants(slug)]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] max-w-[480px] md:max-w-[1100px] w-full mx-auto">
      <div className="px-[18px] py-4 flex items-center gap-2 border-b border-[#E7E9EE]">
        <a href="/" className="text-[#6B7280] text-sm">← 返回</a>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          style={{ background: category?.icon_color ?? '#EDEFF3' }}
        >
          {category?.icon ?? '📁'}
        </div>
        <h1 className="font-bold text-[16px]">{category?.name?.zh ?? slug}</h1>
      </div>

      <div className="px-[18px] py-4">
        {merchants.length === 0 && (
          <p className="text-center text-[#6B7280] text-sm py-10">该分类下暂无商家</p>
        )}
       <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
          {merchants.map((m) => (
            <a
              key={m.id}
              href={`/merchants/${m.slug}`}
              className="flex md:flex-col gap-3 bg-white rounded-xl p-3 border border-[#E7E9EE]"
            >
              <div className="w-20 h-20 md:w-full md:h-32 rounded-lg overflow-hidden bg-[#EDEFF3] flex-shrink-0">
                {m.cover_image && (
                  <img src={m.cover_image} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px] truncate">{m.name?.zh}</p>
                <p className="text-[11px] text-[#6B7280] truncate">{m.name?.kk}</p>
                <div className="flex items-center gap-2 mt-1 text-[10.5px] text-[#6B7280]">
                  <span className={m.is_open_now ? 'text-[#2B8C93]' : 'text-[#B54B3A]'}>
                    {m.is_open_now ? '营业中' : '休息中'}
                  </span>
                  {m.verification_status === 'verified' && <span>✓已认证</span>}
                  {m.price_range && <span>{m.price_range}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
