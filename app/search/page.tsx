import Link from 'next/link';

async function getResults(keyword: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/search?keyword=${encodeURIComponent(keyword)}`, { cache: 'no-store' });
  return res.json();
}

type SearchItem = {
  type: 'merchant' | 'content';
  id: string;
  slug: string;
  name?: Record<string, string>;
  title?: string;
  sort_date: string;
  matched_terms?: string[];
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = q ?? '';
  const result = keyword ? await getResults(keyword) : null;
  const items: SearchItem[] = result?.data ?? [];

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
          <form action="/search" className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={keyword}
              placeholder="搜索商家、地点、服务、攻略…"
              autoFocus
              className="w-full rounded-full px-4 py-[10px] bg-white border border-[#E7E9EE] text-sm outline-none"
            />
          </form>
        </header>

        <div className="px-[18px] pb-2">
          {!keyword && (
            <div className="text-sm text-[#6B7280] py-10 text-center">输入关键词开始搜索</div>
          )}
          {keyword && items.length === 0 && (
            <div className="text-sm text-[#6B7280] py-10 text-center">没有找到与"{keyword}"相关的结果</div>
          )}
          {keyword && items.length > 0 && (
            <div className="text-xs text-[#6B7280] mb-3">找到 {items.length} 条结果</div>
          )}
        </div>

        <div className="flex flex-col gap-2 px-[18px] pb-6">
          {items.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.type === 'merchant' ? `/merchant/${item.slug}` : `/content/${item.slug}`}
              className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center gap-3"
            >
              <span className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 ${
                item.type === 'merchant' ? 'bg-[#2B8C93]/10 text-[#2B8C93]' : 'bg-[#D9A441]/10 text-[#D9A441]'
              }`}>
                {item.type === 'merchant' ? '商家' : '内容'}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.type === 'merchant' ? item.name?.zh : item.title}
                </div>
                {item.matched_terms && item.matched_terms.length > 0 && (
                  <div className="text-[10px] text-[#9AA0AC] mt-[2px]">
                    匹配：{item.matched_terms.join('、')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}