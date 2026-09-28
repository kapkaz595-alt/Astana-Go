import Link from 'next/link';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'span', 'a', 'img', 'div', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['style', 'href', 'src', 'target', 'alt', 'class'],
  });
}

async function getContent(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/contents/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  return res.json();
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  guide: '攻略',
  article: '文章',
  list: '榜单',
  ranking: '排行',
};

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getContent(slug);
  if (!result || !result.success) notFound();

  const c = result.data;
  const t = c.translation as { title: string; body: string; meta_description: string | null };

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center md:py-8">
  <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] md:max-w-[720px] w-full mx-auto md:shadow-2xl md:rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
        </header>

        {c.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover_image} alt={t.title} className="w-full h-[200px] md:h-[360px] object-cover" />
        )}

        <div className="px-[18px] py-4">
          <span className="text-[10px] font-bold bg-[#D9A441]/10 text-[#D9A441] px-2 py-1 rounded-full">
            {CONTENT_TYPE_LABELS[c.content_type] ?? c.content_type}
          </span>
          <h1 className="text-xl font-extrabold mt-3" style={{ fontFamily: 'Manrope' }}>
            {t.title}
          </h1>
          {c.published_at && (
                <div className="text-xs text-[#6B7280] mt-2">
                 {c.updated_at && new Date(c.updated_at).getTime() - new Date(c.published_at).getTime() > 60000
                ? `更新于 ${new Date(c.updated_at).toLocaleDateString('zh-CN')}`
                : `发布于 ${new Date(c.published_at).toLocaleDateString('zh-CN')}`}
                </div>
              )}
        </div>

      <div
            className="px-[18px] md:px-8 pb-8 text-sm md:text-base leading-relaxed md:leading-loose text-[#14171F] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(t.body) }}
          />
      </main>
    </div>
  );
}
