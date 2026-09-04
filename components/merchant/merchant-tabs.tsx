'use client';

import { useState } from 'react';
import GalleryLightbox from '@/components/merchant/gallery-lightbox';

const WEEKDAYS: { key: string; label: string }[] = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
];

const TABS = [
  { key: 'info', label: '基本信息' },
  { key: 'photos', label: '照片' },
  { key: 'menu', label: '菜单套餐' },
  { key: 'detail', label: '详情' },
] as const;

type TabKey = typeof TABS[number]['key'];

function trackClick(slug: string, eventType: string) {
  fetch(`/api/v1/merchants/${slug}/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType }),
  }).catch(() => {});
}

function MenuSection({ items }: { items: any[] }) {
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  ) as string[];

  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const filtered = activeCategory === '全部'
    ? items
    : items.filter((i) => i.category === activeCategory);

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
          {['全部', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border ${
                activeCategory === cat
                  ? 'bg-[#14171F] text-white border-[#14171F]'
                  : 'bg-white text-[#6B7280] border-[#E7E9EE]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((item: any) => (
          <div key={item.id} className="bg-white rounded-xl border border-[#E7E9EE] overflow-hidden">
            {item.image_url && (
              <img src={item.image_url} alt={item.name?.zh} className="w-full aspect-square object-cover" />
            )}
            <div className="p-2">
              <div className="text-sm font-medium truncate">{item.name?.zh}</div>
              {item.price && (
                <div className="text-xs text-[#D9A441] font-bold mt-1">{item.price} 坚戈</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MerchantTabs({ m, name, description, businessHours, slug }: {
  m: any;
  name: Record<string, string>;
  description: Record<string, string>;
  businessHours: Record<string, { open: string; close: string }[]>;
  slug: string;
}) {
  const [active, setActive] = useState<TabKey>('info');

  return (
    <div>
      {/* Tab导航 */}
      <div className="px-[18px] md:px-6 sticky top-0 bg-[#F7F8FA] z-10 border-b border-[#E7E9EE]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active === t.key
                  ? 'border-[#D9A441] text-[#14171F]'
                  : 'border-transparent text-[#6B7280]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 基本信息 */}
      {active === 'info' && (
        <div className="px-[18px] flex flex-col md:grid md:grid-cols-2 gap-3 py-4">
          {m.address && (
            <div className="bg-white rounded-xl border border-[#E7E9EE] p-3">
              <div className="text-xs text-[#6B7280] mb-1">📍 地址</div>
              <div className="text-sm">{m.address}</div>
              {m['2gis_url'] && (
                <a
                  href={m['2gis_url']}
                  target="_blank"
                  onClick={() => trackClick(slug, '2gis')}
                  className="text-xs text-[#2B8C93] mt-2 inline-block"
                >
                  在2GIS中查看 ›
                </a>
              )}
            </div>
          )}

          {m.phone && (
            <a
              href={`tel:${m.phone}`}
              onClick={() => trackClick(slug, 'phone')}
              className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-[#6B7280] mb-1">📞 电话</div>
                <div className="text-sm font-medium">{m.phone}</div>
              </div>
              <span className="text-[#D9A441]">›</span>
            </a>
          )}

          {m.whatsapp && (
            <a
              href={`https://wa.me/${m.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              onClick={() => trackClick(slug, 'whatsapp')}
              className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between"
            >
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
      )}

      {/* 照片 */}
      {active === 'photos' && (
        <div className="px-[18px] md:px-6 py-4">
          {m.gallery_images && m.gallery_images.length > 0 ? (
            <GalleryLightbox images={m.gallery_images as string[]} name={name?.zh ?? ''} />
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">暂无照片</div>
          )}
        </div>
      )}

      {/* 菜单套餐 */}
      {active === 'menu' && (
        <div className="px-[18px] md:px-6 py-4">
          {m.menu_items && m.menu_items.length > 0 ? (
            <MenuSection items={m.menu_items} />
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">该商家暂无菜单信息</div>
          )}
        </div>
      )}

      {/* 详情 */}
      {active === 'detail' && (
        <div className="px-[18px] md:px-6 py-4">
          {description?.zh ? (
            <p className="text-sm text-[#14171F] leading-relaxed whitespace-pre-line">{description.zh}</p>
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">暂无详情介绍</div>
          )}
        </div>
      )}
    </div>
  );
}
