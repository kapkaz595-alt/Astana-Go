import Link from 'next/link';

async function getContents() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/contents?page_size=50`, { cache: 'no-store' });
  return res.json();
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  guide: '攻略',
  article: '文章',
  list: '榜单',
  ranking: '排行',
};

type ContentItem = {
  id: string; slug: string; content_type: string; cover_image: string | null; published_at: string;
  translation: { title: string };
};

export default async function ContentsPage() {
  const result = await getContents();
  const items: ContentItem[] = result?.data ?? [];

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
          <div className="font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>本地精选</div>
        </header>

        <div className="px-[18px] pb-2 text-xs text-[#6B7280]">
          共 {items.length} 篇内容
        </div>

        <div className="grid grid-cols-2 gap-[10px] px-[18px] pb-6">
          {items.length === 0 && (
            <div className="col-span-2 text-sm text-[#6B7280] py-10 text-center">暂无内容</div>
          )}
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/content/${c.slug}`}
              className="rounded-xl overflow-hidden bg-white border border-[#E7E9EE]"
            >
              {c.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover_image} alt={c.translation?.title} className="w-full h-[100px] object-cover" />
              ) : (
                <div className="w-full h-[100px] bg-gradient-to-br from-[#3A5F6A] to-[#152A30]" />
              )}
              <div className="p-2">
                <span className="text-[9px] font-bold text-[#D9A441]">
                  {CONTENT_TYPE_LABELS[c.content_type] ?? c.content_type}
                </span>
                <div className="text-xs font-medium mt-1 line-clamp-2">{c.translation?.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}