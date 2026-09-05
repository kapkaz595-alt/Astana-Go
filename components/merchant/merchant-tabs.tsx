'use client';

import { useState } from 'react';
import GalleryLightbox from '@/components/merchant/gallery-lightbox';

const UI_TEXT = {
  zh: {
    weekdays: { monday: '周一', tuesday: '周二', wednesday: '周三', thursday: '周四', friday: '周五', saturday: '周六', sunday: '周日' },
    tabs: { info: '基本信息', photos: '照片', menu: '菜单套餐', detail: '详情' },
    all: '全部',
    address: '地址', viewOn2gis: '在2GIS中查看 ›', phone: '电话', whatsapp: 'WhatsApp',
    businessHours: '营业时间', rest: '休息', views: '次浏览', currency: '坚戈',
    noPhotos: '暂无照片', noMenu: '该商家暂无菜单信息', noDetail: '暂无详情介绍',
    noItemDetail: '暂无详情介绍',
    instagram: 'Instagram', website: '官网/订餐',
  },
  kk: {
    weekdays: { monday: 'Дүйсенбі', tuesday: 'Сейсенбі', wednesday: 'Сәрсенбі', thursday: 'Бейсенбі', friday: 'Жұма', saturday: 'Сенбі', sunday: 'Жексенбі' },
    tabs: { info: 'Негізгі ақпарат', photos: 'Фотосуреттер', menu: 'Мәзір', detail: 'Толығырақ' },
    all: 'Барлығы',
    address: 'Мекенжай', viewOn2gis: '2GIS-те қарау ›', phone: 'Телефон', whatsapp: 'WhatsApp',
    businessHours: 'Жұмыс уақыты', rest: 'Демалыс', views: 'қаралым', currency: 'теңге',
    noPhotos: 'Фотосурет жоқ', noMenu: 'Мәзір ақпараты жоқ', noDetail: 'Толығырақ ақпарат жоқ',
    noItemDetail: 'Толығырақ ақпарат жоқ',
    instagram: 'Instagram', website: 'Сайт/тапсырыс',
  },
};

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function trackClick(slug: string, eventType: string) {
  fetch(`/api/v1/merchants/${slug}/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType }),
  }).catch(() => {});
}

function MenuSection({ items, locale, t }: { items: any[]; locale: 'zh' | 'kk'; t: typeof UI_TEXT['zh'] }) {
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  ) as string[];

  const [activeCategory, setActiveCategory] = useState<string>(t.all);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const filtered = activeCategory === t.all
    ? items
    : items.filter((i) => i.category === activeCategory);

  return (
    <div>
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
          {[t.all, ...categories].map((cat) => (
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
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="text-left bg-white rounded-xl border border-[#E7E9EE] overflow-hidden"
          >
            {item.image_url && (
              <img src={item.image_url} alt={item.name?.[locale] ?? item.name?.zh} className="w-full aspect-square object-cover" />
            )}
            <div className="p-2">
              <div className="text-sm font-medium truncate">{item.name?.[locale] ?? item.name?.zh}</div>
              {item.price && (
                <div className="text-xs text-[#D9A441] font-bold mt-1">{item.price} {t.currency}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedItem.image_url && (
              <img src={selectedItem.image_url} alt={selectedItem.name?.[locale] ?? selectedItem.name?.zh} className="w-full aspect-video object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-base font-bold">{selectedItem.name?.[locale] ?? selectedItem.name?.zh}</div>
                <button onClick={() => setSelectedItem(null)} className="text-[#6B7280] text-xl leading-none">×</button>
              </div>
              {selectedItem.price && (
                <div className="text-sm text-[#D9A441] font-bold mb-3">{selectedItem.price} {t.currency}</div>
              )}
              {selectedItem.detail?.[locale] || selectedItem.detail?.zh ? (
                <p className="text-sm text-[#14171F] leading-relaxed whitespace-pre-line">
                  {selectedItem.detail?.[locale] || selectedItem.detail?.zh}
                </p>
              ) : (
                <p className="text-sm text-[#B0B5BF]">{t.noItemDetail}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantTabs({ m, name, description, businessHours, slug, locale }: {
  m: any;
  name: Record<string, string>;
  description: Record<string, string>;
  businessHours: Record<string, { open: string; close: string }[]>;
  slug: string;
  locale: 'zh' | 'kk';
}) {
  const t = UI_TEXT[locale];
  const TABS = [
    { key: 'info', label: t.tabs.info },
    { key: 'photos', label: t.tabs.photos },
    { key: 'menu', label: t.tabs.menu },
    { key: 'detail', label: t.tabs.detail },
  ] as const;
  type TabKey = typeof TABS[number]['key'];
  const [active, setActive] = useState<TabKey>('info');

  return (
    <div>
      {/* Tab导航 */}
      <div className="px-[18px] md:px-6 sticky top-0 bg-[#F7F8FA] z-10 border-b border-[#E7E9EE]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active === tab.key
                  ? 'border-[#D9A441] text-[#14171F]'
                  : 'border-transparent text-[#6B7280]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 基本信息 */}
      {active === 'info' && (
        <div className="px-[18px] flex flex-col md:grid md:grid-cols-2 gap-3 py-4">
          {m.address && (
            <div className="bg-white rounded-xl border border-[#E7E9EE] p-3">
              <div className="text-xs text-[#6B7280] mb-1">📍 {t.address}</div>
              <div className="text-sm">{m.address}</div>
              {m['2gis_url'] && (
                <a
                  href={m['2gis_url']}
                  target="_blank"
                  onClick={() => trackClick(slug, '2gis')}
                  className="text-xs text-[#2B8C93] mt-2 inline-block"
                >
                  {t.viewOn2gis}
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
                <div className="text-xs text-[#6B7280] mb-1">📞 {t.phone}</div>
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
                <div className="text-xs text-[#6B7280] mb-1">💬 {t.whatsapp}</div>
                <div className="text-sm font-medium">{m.whatsapp}</div>
              </div>
              <span className="text-[#D9A441]">›</span>
            </a>
          )}

          {m.instagram && (
            <a
              href={m.instagram}
              target="_blank"
              onClick={() => trackClick(slug, 'instagram')}
              className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="text-xs text-[#6B7280] mb-1">📷 {t.instagram}</div>
                <div className="text-sm font-medium truncate">{m.instagram}</div>
              </div>
              <span className="text-[#D9A441] shrink-0">›</span>
            </a>
          )}

          {m.website && (
            <a
              href={m.website}
              target="_blank"
              onClick={() => trackClick(slug, 'website')}
              className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="text-xs text-[#6B7280] mb-1">🌐 {t.website}</div>
                <div className="text-sm font-medium truncate">{m.website}</div>
              </div>
              <span className="text-[#D9A441] shrink-0">›</span>
            </a>
          )}

          {businessHours && (
            <div className="bg-white rounded-xl border border-[#E7E9EE] p-3">
              <div className="text-xs text-[#6B7280] mb-2">🕐 {t.businessHours}</div>
              <div className="flex flex-col gap-1">
                {WEEKDAY_KEYS.map((key) => {
                  const slots = businessHours[key];
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">{t.weekdays[key]}</span>
                      <span className={slots?.length ? 'text-[#14171F]' : 'text-[#B0B5BF]'}>
                        {slots?.length ? slots.map((s) => `${s.open}-${s.close}`).join(', ') : t.rest}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E7E9EE] p-3 flex items-center gap-4 text-xs text-[#6B7280] tabular-nums">
            <span>👁 {m.view_count} {t.views}</span>
          </div>
        </div>
      )}

      {/* 照片 */}
      {active === 'photos' && (
        <div className="px-[18px] md:px-6 py-4">
          {m.gallery_images && m.gallery_images.length > 0 ? (
            <GalleryLightbox images={m.gallery_images as string[]} name={name?.[locale] ?? name?.zh ?? ''} />
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">{t.noPhotos}</div>
          )}
        </div>
      )}

      {/* 菜单套餐 */}
      {active === 'menu' && (
        <div className="px-[18px] md:px-6 py-4">
          {m.menu_items && m.menu_items.length > 0 ? (
            <MenuSection items={m.menu_items} locale={locale} t={t} />
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">{t.noMenu}</div>
          )}
        </div>
      )}

      {/* 详情 */}
      {active === 'detail' && (
        <div className="px-[18px] md:px-6 py-4">
          {description?.[locale] || description?.zh ? (
            <p className="text-sm text-[#14171F] leading-relaxed whitespace-pre-line">{description?.[locale] || description?.zh}</p>
          ) : (
            <div className="text-sm text-[#B0B5BF] text-center py-12">{t.noDetail}</div>
          )}
        </div>
      )}
    </div>
  );
}
