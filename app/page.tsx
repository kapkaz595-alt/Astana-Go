'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONTENT_TABS = ['攻略 & 资讯', '美食', '打卡', '购物', '交通'];
const TAB_TAGS = ['guide', 'food', 'checkin', 'shopping', 'transport'];

type Category = { id: string; slug: string; name: Record<string, string>; icon: string | null; icon_color: string | null };
type Merchant = {
  id: string; slug: string; name: Record<string, string>;
  view_count: number; verification_status: string; is_open_now: boolean;
};
type ContentItem = {
  id: string; slug: string; cover_image: string | null; published_at: string;
  translation: { title: string };
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetch('/api/v1/categories?locale=zh').then(r => r.json()).then(d => setCategories(d.data ?? []));
    fetch('/api/v1/merchants?page_size=10').then(r => r.json()).then(d => setMerchants(d.data ?? []));
  }, []);

  useEffect(() => {
    fetch(`/api/v1/contents?tag=${TAB_TAGS[activeTab]}&page_size=5`)
      .then(r => r.json()).then(d => setContents(d.data ?? []));
  }, [activeTab]);

   return (
    <div className="min-h-screen bg-[#DEE1E6] flex justify-center py-8">
      <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] w-full mx-auto shadow-2xl rounded-3xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-[18px] pt-[18px] pb-[14px]">
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-white font-extrabold text-base"
               style={{ background: 'linear-gradient(135deg,#D9A441,#C68A2E)', fontFamily: 'Manrope' }}>
            A
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-[15px]" style={{ fontFamily: 'Manrope' }}>Astana Go</div>
            <div className="font-bold text-[9.5px] tracking-wider text-[#6B7280]" style={{ fontFamily: 'Manrope' }}>本地生活</div>
          </div>
        </div>
        <button className="bg-[#EDEFF3] rounded-full px-[13px] py-[6px] text-xs font-semibold">中 / Қаз</button>
      </header>

      {/* Search */}
      <div className="px-[18px] pb-[18px]">
        <form action="/search" className="bg-white border border-[#E7E9EE] rounded-full px-4 py-[13px] flex items-center gap-2 text-sm shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA0AC" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="搜索商家、地点、服务、攻略…"
            className="flex-1 outline-none text-[#14171F] placeholder:text-[#6B7280]"
          />
        </form>
      </div>

      {/* Categories */}
      <div className="px-3 pb-5 grid grid-cols-5 gap-x-[2px] gap-y-[14px]">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="flex flex-col items-center gap-[6px] text-center">
            <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg text-white"
                 style={{ background: c.icon_color ?? '#EDEFF3' }}>
              {c.icon ?? '📍'}
            </div>
            <span className="text-[10px] font-medium">{c.name?.zh ?? c.slug}</span>
          </Link>
        ))}
      </div>

      {/* Emergency banner */}
      <Link href="/emergency" className="mx-[18px] mb-1 bg-[#14171F] rounded-[14px] px-[14px] py-[13px] flex items-center gap-[11px]">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#B54B3A] flex items-center justify-center text-lg shrink-0">🚨</div>
        <div className="flex-1">
          <div className="text-white font-bold text-[13px]" style={{ fontFamily: 'Manrope' }}>紧急求助中心</div>
          <div className="text-[#A6ACB8] text-[10.5px] mt-[2px]">急救 · 警察 · 消防 一键直达</div>
        </div>
        <div className="text-[#D9A441] text-[17px]">›</div>
      </Link>

      {/* Hot merchants */}
      <div className="flex items-center justify-between px-[18px] pt-[20px] pb-3">
        <div className="flex items-center gap-[7px] font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>
          营业中 · 热门推荐
          <span className="flex items-center gap-1 text-[10.5px] font-semibold text-[#2B8C93]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#2B8C93]" />实时更新
          </span>
        </div>
        <Link href="/merchants?filter=open" className="text-xs text-[#6B7280] font-medium">查看全部 ›</Link>
      </div>
      <div className="flex gap-[11px] overflow-x-auto px-[18px] pb-1 no-scrollbar">
        {merchants.map((m, i) => {
          const gradients = [
            'linear-gradient(135deg,#6B5B4A,#3D3227)',
            'linear-gradient(135deg,#8A6A4A,#4A3A28)',
            'linear-gradient(135deg,#4A6B5A,#2A3F34)',
            'linear-gradient(135deg,#3A4550,#1E252C)',
          ];
          return (
            <Link key={m.id} href={`/merchants/${m.slug}`} className="shrink-0 w-[148px] bg-white rounded-[14px] overflow-hidden border border-[#E7E9EE]">
              <div className="h-[104px] flex items-end p-2" style={{ background: gradients[i % gradients.length] }}>
                <span className={`text-[9.5px] font-bold px-2 py-[3px] rounded-full flex items-center gap-1 bg-white/95 ${m.is_open_now ? 'text-[#1D7A44]' : 'text-[#B54B3A]'}`}>
                  <span className={`w-[6px] h-[6px] rounded-full ${m.is_open_now ? 'bg-[#2E9E5B]' : 'bg-[#B54B3A]'}`} />
                  {m.is_open_now ? '营业中' : '已打烊'}
                </span>
              </div>
              <div className="px-[10px] pt-[9px] pb-[10px]">
                <div className="text-[13px] font-bold">{m.name?.zh ?? ''}</div>
                <div className="text-[10.5px] text-[#6B7280] mt-[1px]">{m.name?.ru ?? m.name?.kk ?? ''}</div>
                <div className="flex items-center gap-2 mt-[7px] text-[10px] text-[#6B7280] tabular-nums">
                  <span>👁 {m.view_count}</span>
                  {m.verification_status === 'verified' ? (
                    <span className="text-[#2B8C93] font-semibold">✓ 已认证</span>
                  ) : (
                    <span className="text-[#B0B5BF]">○ 待认证</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Local picks */}
      <div className="flex items-center justify-between px-[18px] pt-[22px] pb-3">
        <div className="font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>本地精选</div>
        <Link href="/contents" className="text-xs text-[#6B7280] font-medium">查看全部 ›</Link>
      </div>
      <div className="flex gap-4 px-[18px] pb-[14px] overflow-x-auto no-scrollbar text-[12.5px] text-[#6B7280] font-medium">
        {CONTENT_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`whitespace-nowrap pb-[6px] ${i === activeTab ? 'text-[#14171F] font-bold border-b-2 border-[#D9A441]' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-[18px] grid grid-cols-2 grid-rows-2 gap-[10px]">
        {contents[0] && (
          <Link href={`/content/${contents[0].slug}`}
                className="row-span-2 rounded-[14px] overflow-hidden relative min-h-[236px] flex flex-col justify-end p-[14px]"
                style={{ background: 'linear-gradient(160deg,#3A5F6A,#152A30)' }}>
            <span className="absolute top-[10px] left-[10px] bg-white/92 text-[9.5px] font-bold px-[9px] py-1 rounded-full">攻略</span>
            <div className="text-white font-extrabold text-[15px] leading-snug" style={{ fontFamily: 'Manrope' }}>
              {contents[0].translation?.title}
            </div>
            <div className="text-white/85 text-[10.5px] mt-[6px]">👁 浏览</div>
          </Link>
        )}
        {contents.slice(1, 5).map((c, i) => {
          const bgs = [
            'linear-gradient(160deg,#C97B3E,#8C4F22)',
            'linear-gradient(160deg,#4A5A8A,#232C4E)',
            'linear-gradient(160deg,#6B7280,#2E3238)',
            'linear-gradient(160deg,#4C9E6B,#1E4A31)',
          ];
          return (
            <Link key={c.id} href={`/content/${c.slug}`}
                  className="rounded-xl overflow-hidden relative min-h-[113px] flex flex-col justify-end p-[10px]"
                  style={{ background: bgs[i] }}>
              <div className="text-white font-bold text-xs leading-snug" style={{ fontFamily: 'Manrope' }}>
                {c.translation?.title}
              </div>
              <div className="text-white/75 text-[9.5px] mt-[6px]">👁 浏览</div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-7 bg-white border-t border-[#E7E9EE] px-[18px] pt-[26px] pb-6">
        <div className="flex gap-[14px] justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-[11.5px] font-bold mb-[10px]">关于我们</h4>
            <div className="text-[10.5px] text-[#6B7280] mb-2">· 平台介绍</div>
            <div className="text-[10.5px] text-[#6B7280] mb-2">· 使用条款</div>
            <div className="text-[10.5px] text-[#6B7280] mb-2">· 隐私政策</div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11.5px] font-bold mb-[10px]">联系我们</h4>
            <div className="text-[10.5px] text-[#6B7280] mb-2">✉️ hello@astanago.com</div>
            <div className="text-[10.5px] text-[#6B7280] mb-2">💬 WhatsApp 联系</div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[11.5px] font-bold mb-[10px]">关注我们</h4>
            <div className="flex gap-[6px]">
              <span className="w-[30px] h-[30px] rounded-[9px] bg-[#07C160] flex items-center justify-center text-white text-xs">微</span>
              <span className="w-[30px] h-[30px] rounded-[9px] bg-black flex items-center justify-center text-white text-xs">抖</span>
              <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white text-xs"
                    style={{ background: 'radial-gradient(circle at 30% 110%, #FDF497 0%, #FD5949 45%, #D6249F 60%, #285AEB 90%)' }}>I</span>
            </div>
          </div>
        </div>
        <div className="mt-[22px] pt-4 border-t border-[#E7E9EE] text-[10.5px] text-[#9AA0AC] text-center">
          © {new Date().getFullYear()} Astana Go · 保留所有权利
        </div>
      </footer>
    </main>
    </div>
  );
}