import Link from 'next/link';
import { notFound } from 'next/navigation';
import GallerySlider from '@/components/merchant/gallery-slider';

async function getMerchant(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/v1/merchants/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  return res.json();
}

const WEEKDAYS: { key: string; label: string }[] = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
];

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getMerchant(slug);
  if (!result || !result.success) notFound();

  const m = result.data;
  const name = m.name as Record<string, string>;
  const description = m.description as Record<string, string>;
  const businessHours = m.business_hours as Record<string, { open: string; close: string }[]>;

  return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
        <header className="flex items-center gap-3 px-[18px] pt-[18px] pb-[14px]">
          <Link href="/" className="text-[#6B7280] text-lg">‹</Link>
        </header>

        <div className="px-[18px] pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-[3px] rounded-full ${
              m.is_open_now ? 'bg-[#2E9E5B]/10 text-[#1D7A44]' : 'bg-[#B54B3A]/10 text-[#B54B3A]'
            }`}>
              {m.is_open_now ? '营业中' : '已打烊'}
            </span>
            {m.verification_status === 'verified' && (
              <span className="text-[10px] font-semibold text-[#2B8C93]">✓ 已认证</span>
            )}
          </div>

         {m.gallery_images && m.gallery_images.length > 0 && (
  <div className="px-[18px] pb-4">
    <GallerySlider images={m.gallery_images as string[]} name={name?.zh ?? ''} />
  </div>
)}
          
          <h1 className="text-xl font-extrabold" style={{ fontFamily: 'Manrope' }}>{name?.zh}</h1>
          <div className="text-sm text-[#6B7280] mt-1">{name?.ru} · {name?.kk}</div>
          {description?.zh && (
            <p className="text-sm text-[#14171F] mt-3 leading-relaxed">{description.zh}</p>
          )}
        </div>

        <div className="px-[18px] flex flex-col gap-3 pb-4">
          {m.address && (
            <div className="bg-white rounded-xl border border-[#E7E9EE] p-3">
              <div className="text-xs text-[#6B7280] mb-1">📍 地址</div>
              <div className="text-sm">{m.address}</div>
              {m['2gis_url'] && (
                <a href={m['2gis_url']} target="_blank" className="text-xs text-[#2B8C93] mt-2 inline-block">
                  在2GIS中查看 ›
                </a>
              )}
            </div>
          )}

          {m.phone && (
            <a href={`tel:${m.phone}`} className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#6B7280] mb-1">📞 电话</div>
                <div className="text-sm font-medium">{m.phone}</div>
              </div>
              <span className="text-[#D9A441]">›</span>
            </a>
          )}

          {m.whatsapp && (
            <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`} target="_blank" className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#6B7280] mb-1">💬 WhatsApp</div>
                <div className="text-sm font-medium">{m.whatsapp}</div>
              </div>
              <span className="text-[#D9A441]">›</span>
            </a>
          )}

          {businessHours && (
            <div className="bg-white rounded-xl border border-[#E7E9EE] p-3">
              <div className="text-xs text-[#6B7280] mb-2">🕐 营业时间</div>
              <div className="flex flex-col gap-1">
                {WEEKDAYS.map((d) => {
                  const slots = businessHours[d.key];
                  return (
                    <div key={d.key} className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">{d.label}</span>
                      <span className={slots?.length ? 'text-[#14171F]' : 'text-[#B0B5BF]'}>
                        {slots?.length ? slots.map((s) => `${s.open}-${s.close}`).join(', ') : '休息'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center gap-4 text-xs text-[#6B7280] tabular-nums">
            <span>👁 {m.view_count} 次浏览</span>
          </div>
        </div>
      </main>
    </div>
  );
}
