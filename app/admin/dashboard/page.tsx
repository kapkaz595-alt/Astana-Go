'use client';

import { useEffect, useState } from 'react';

interface Stats {
  categoryCount: number;
  merchantCount: number;
  activeMerchantCount: number;
  verifiedMerchantCount: number;
  featuredMerchantCount: number;
  contentCount: number;
  menuItemCount: number;
  totalViews: number;
  phoneClicks: number;
  whatsappClicks: number;
  gisClicks: number;
  topViewed: { id: string; name: any; view_count: number }[];
  topConverted: { id: string; name: any; clicks: number }[];
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-400">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-sm text-red-500">统计数据加载失败</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">概览</h2>
      <p className="text-sm text-slate-500 mb-6">实时统计数据</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">分类</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.categoryCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">商家（营业中/总数）</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {stats.activeMerchantCount} / {stats.merchantCount}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">内容</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.contentCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">已认证商家</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.verifiedMerchantCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">首页推荐商家</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.featuredMerchantCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">菜单套餐总数</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.menuItemCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">总浏览量</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.totalViews}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">电话点击</p>
          <p className="text-2xl font-semibold text-[#D9A441] mt-1">{stats.phoneClicks}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">WhatsApp点击</p>
          <p className="text-2xl font-semibold text-[#2B8C93] mt-1">{stats.whatsappClicks}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">2GIS跳转</p>
          <p className="text-2xl font-semibold text-[#3C7FE0] mt-1">{stats.gisClicks}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">浏览量Top10商家</p>
          <div className="flex flex-col gap-2">
            {stats.topViewed.map((m, i) => (
              <div key={m.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{i + 1}. {m.name?.zh}</span>
                <span className="text-slate-900 font-medium">{m.view_count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">转化点击Top10商家</p>
          <div className="flex flex-col gap-2">
            {stats.topConverted.map((m, i) => (
              <div key={m.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{i + 1}. {m.name?.zh}</span>
                <span className="text-slate-900 font-medium">{m.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
