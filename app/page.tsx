'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NoticeBar } from '@/components/home/notice-bar';
import { BannerSlot } from '@/components/home/banner-slot';
import { MasonryFeed } from '@/components/home/masonry-feed';
import FooterSocial from '@/components/footer-social';

const UI_TEXT = {
  zh: {
    searchPlaceholder: '搜索商家、地点、服务、攻略…',
    hotPicks: '营业中 · 热门推荐',
    liveUpdate: '实时更新',
    viewAll: '查看全部',
    localPicks: '本地精选',
    open: '营业中',
    unverified: '待认证',
    noMore: '没有更多了',
    closed: '已打烊',
    verified: '已认证',
    aboutUs: '关于我们',
    platformIntro: '平台介绍',
    terms: '使用条款',
    privacy: '隐私政策',
    contactUs: '联系我们',
    followUs: '关注我们',
    whatsappContact: 'WhatsApp 联系',
    copyright: '© 2026 Astana Go · 保留所有权利',
  },
  kk: {
    searchPlaceholder: 'Дүкен, орын, қызмет, нұсқаулық іздеу…',
    hotPicks: 'Ашық · Танымал',
    liveUpdate: 'Real-time',
    viewAll: 'Барлығын көру',
    localPicks: 'Таңдаулы нұсқаулықтар',
    open: 'Ашық',
    unverified: 'Расталмаған',
    noMore: 'Басқа жоқ',
    closed: 'Жабық',
    verified: 'Расталған',
    aboutUs: 'Біз туралы',
    platformIntro: 'Платформа туралы',
    terms: 'Пайдалану шарттары',
    privacy: 'Құпиялылық саясаты',
    contactUs: 'Байланыс',
    followUs: 'Бізді қадағалаңыз',
    whatsappContact: 'WhatsApp арқылы хабарласу',
    copyright: '© 2026 Astana Go · Барлық құқықтар қорғалған',
  },
};

const CONTENT_TABS = ['攻略 & 资讯'];
const TAB_TAGS = ['guide'];

type Category = { id: string; slug: string; name: string; icon: string | null; icon_color: string | null };
type Merchant = {
  id: string; slug: string; name: string; cover_image: string | null;
  view_count: number; verification_status: string; is_open_now: boolean;
};
type ContentItem = {
  id: string; slug: string; cover_image: string | null; published_at: string;
  translation: { title: string };
};

type Banner = { id: string; image_url: string; link_url: string | null };
type LocalPickCategory = { id: string; slug: string; name: { zh?: string; kk?: string; ru?: string } };

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [localPickCategories, setLocalPickCategories] = useState<LocalPickCategory[]>([]);
  const [activeLocalPickCategory, setActiveLocalPickCategory] = useState<string>('');

  const [locale, setLocale] = useState<'zh' | 'kk'>('zh');
  const t = UI_TEXT[locale];

useEffect(() => {
  const saved = document.cookie.split('; ').find(c => c.startsWith('locale='))?.split('=')[1];
  if (saved === 'kk' || saved === 'zh') setLocale(saved);
}, []);

function toggleLocale() {
  const next = locale === 'zh' ? 'kk' : 'zh';
  setLocale(next);
  document.cookie = `locale=${next}; path=/; max-age=31536000`;
}

 useEffect(() => {
    fetch(`/api/v1/categories?locale=${locale}`).then(r => r.json()).then(d => setCategories(d.data ?? []));
    fetch(`/api/v1/merchants?page_size=10&locale=${locale}&featured=true`).then(r => r.json()).then(d => setMerchants(d.data ?? []));
    fetch('/api/v1/banners?position=homepage_top').then(r => r.json()).then(d => setBanners(d.data ?? []));
    fetch('/api/v1/local-pick-categories').then(r => r.json()).then(d => setLocalPickCategories(d.data ?? []));
  }, [locale]);

  useEffect(() => {
    const categoryParam = activeLocalPickCategory ? `&category=${activeLocalPickCategory}` : '';
    fetch(`/api/v1/feed?page=1&page_size=6&locale=${locale}${categoryParam}`).then(r => r.json()).then(d => {
      setFeedItems(d.data ?? []);
      setFeedHasMore(d.pagination?.has_more ?? false);
    });
  }, [locale, activeLocalPickCategory]);

   return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center md:py-8">
  <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] md:max-w-[1200px] w-full mx-auto md:shadow-2xl">
    <div className="sticky top-0 z-50 bg-[#E6F4FA]">
      {/* Header */}
      <header className="flex items-center justify-between px-[18px] pt-[18px] pb-[14px]">
        <div className="flex items-center gap-2">
         <img src="/logo.png" alt="Astana Go" className="h-[36px] w-auto" />
        </div>
        <button onClick={toggleLocale} className="bg-[#EDEFF3] rounded-full px-[13px] py-[6px] text-xs font-semibold">
  {locale === 'zh' ? '中 / Қаз' : 'Қаз / 中'}
</button>
      </header>

      <NoticeBar locale={locale} />

      {/* Search */}
      <div className="px-[18px] pb-[18px]">
        <form action="/search" className="bg-white border border-[#E7E9EE] rounded-full px-4 py-[13px] flex items-center gap-2 text-sm shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder={t.searchPlaceholder}
            className="flex-1 outline-none text-[#14171F] placeholder:text-[#6B7280]"
          />
        </form>
      </div>
   </div>

      {/* Categories */}
      <div className="px-3 pb-5 grid grid-cols-5 md:grid-cols-10 gap-x-[2px] md:gap-x-4 gap-y-[14px]">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="flex flex-col items-center gap-[6px] text-center">
            <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg text-white"
                 style={{ background: c.icon_color ?? '#EDEFF3' }}>
              {c.icon ?? '📍'}
            </div>
           <span className="text-[10px] font-medium">{c.name ?? c.slug}</span>
          </Link>
        ))}
      </div>

      <div className="mx-[18px] mb-1">
  <BannerSlot banners={banners} />
</div>

      {/* Hot merchants */}
      <div className="flex items-center justify-between px-[18px] pt-[20px] pb-3">
        <div className="flex items-center gap-[7px] font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>
         {t.hotPicks}
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-[#2B8C93]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#2B8C93]" />{t.liveUpdate}
          </span>
        </div>
        <Link href="/merchants?filter=open" className="text-xs text-[#6B7280] font-medium py-2 px-1 -mr-1">{t.viewAll}</Link>
      </div>
     <div
  className="flex md:grid md:grid-cols-6 gap-[11px] overflow-x-auto md:overflow-visible px-[18px] pb-1 no-scrollbar"
  style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity' }}
>
        {merchants.map((m, i) => {
          const gradients = [
            'linear-gradient(135deg,#6B5B4A,#3D3227)',
            'linear-gradient(135deg,#8A6A4A,#4A3A28)',
            'linear-gradient(135deg,#4A6B5A,#2A3F34)',
            'linear-gradient(135deg,#3A4550,#1E252C)',
          ];
          return (
           <Link key={m.id} href={`/merchants/${m.slug}`} className="shrink-0 md:shrink md:w-auto w-[148px] bg-white rounded-[14px] overflow-hidden border bo..." style={{ scrollSnapAlign: 'start' }}>
             <div
  className="h-[104px] flex items-end p-2 bg-cover bg-center"
  style={
    m.cover_image
      ? { backgroundImage: `url(${m.cover_image})` }
      : { background: gradients[i % gradients.length] }
  }
>
                <span className={`text-[9.5px] font-bold px-2 py-[3px] rounded-full flex items-center gap-1 bg-white/95 ${m.is_open_now ? 'text-[#1D7A44]' : 'text-[#B54B3A]'}`}>
                  <span className={`w-[6px] h-[6px] rounded-full ${m.is_open_now ? 'bg-[#2E9E5B]' : 'bg-[#B54B3A]'}`} />
                 {m.is_open_now ? t.open : t.closed}
                </span>
              </div>
              <div className="px-[10px] pt-[9px] pb-[10px]">
               <div className="text-[13px] font-bold">{m.name}</div>
                <div className="flex items-center gap-2 mt-[7px] text-[10px] text-[#6B7280] tabular-nums">
                  <span>👁 {m.view_count}</span>
                  {m.verification_status === 'verified' ? (
                  <span className="text-[#2B8C93] font-semibold">✓ {t.verified}</span>
                  ) : (
                  <span className="text-[#B0B5BF]">○ {t.unverified}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    {/* Local picks */}
        <div className="flex items-center justify-between px-[18px] pt-[22px] pb-3">
          <div className="font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>{t.localPicks}</div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-[18px] pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setActiveLocalPickCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${activeLocalPickCategory === '' ? 'bg-black text-white' : 'bg-[#EDEFF3] text-[#6B7280]'}`}
          >
            全部
          </button>
          {localPickCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveLocalPickCategory(c.slug)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${activeLocalPickCategory === c.slug ? 'bg-black text-white' : 'bg-[#EDEFF3] text-[#6B7280]'}`}
            >
              {c.name?.zh}
            </button>
          ))}
        </div>
        <div className="px-[18px]">
          <MasonryFeed initialItems={feedItems} initialHasMore={feedHasMore} key={activeLocalPickCategory} />
        </div>

      {/* Footer */}
      <footer className="mt-7 bg-white border-t border-[#E7E9EE] px-[18px] pt-[26px] pb-6">
        <div className="flex gap-[14px] justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-[11.5px] font-bold mb-[10px]">{t.aboutUs}</h4>
            <a href="/about" className="block text-[10.5px] text-[#6B7280] mb-2 hover:underline">· {t.platformIntro}</a>
            <a href="/terms" className="block text-[10.5px] text-[#6B7280] mb-2 hover:underline">· {t.terms}</a>
            <a href="/privacy" className="block text-[10.5px] text-[#6B7280] mb-2 hover:underline">· {t.privacy}</a>
          </div>
          <div className="flex-1 min-w-0">
           <h4 className="text-[11.5px] font-bold mb-[10px]">{t.contactUs}</h4>
            <a href="/contact" className="block text-[10.5px] text-[#6B7280] mb-2 hover:underline">■ {t.contactUs}</a>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11.5px] font-bold mb-[10px]">{t.followUs}</h4>
           <FooterSocial />
          </div>
        </div>
        <div className="mt-[22px] pt-4 border-t border-[#E7E9EE] text-[10.5px] text-[#9AA0AC] text-center">
          {t.copyright}
        </div>
      </footer>
    </main>
    </div>
  );
}
