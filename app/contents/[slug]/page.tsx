import Link from 'next/link';

async function getContent(slug: string, locale: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/contents/${slug}?locale=${locale}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale = 'zh' } = await searchParams;
  const result = await getContent(slug, locale);

  if (!result?.success || !result?.data) {
    return (
      <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
        <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden px-[18px] py-10">
          <Link href="/" className="text-sm text-[#6B7280]">‹ 返回首页</Link>
          <div className="text-center text-[#6B7280] mt-10">内容不存在</div>
        </main>
      </div>
    );
  }

  const c = result.data;
  const t = c.translation;

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <div className="px-[18px] pt-[18px] pb-4">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
        </div>

        {c.cover_image && (
          <img src={c.cover_image} className="w-full aspect-[4/3] object-cover" />
        )}

        <div className="px-[18px] py-4">
          <h1 className="text-xl font-extrabold" style={{ fontFamily: 'Manrope' }}>{t?.title}</h1>
          <div className="text-sm text-[#14171F] mt-4 leading-relaxed whitespace-pre-wrap">
            {t?.body}
          </div>
        </div>
      </main>
    </div>
  );
}
