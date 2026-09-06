'use client';

import { useEffect, useState } from 'react';

export default function PageStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/page-stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">加载中…</div>;
  if (!stats) return <div className="p-6">加载失败</div>;

  const cards = [
    { label: '今日访问', views: stats.today_views, visitors: stats.today_visitors },
    { label: '近7天', views: stats.week_views, visitors: stats.week_visitors },
    { label: '近30天', views: stats.month_views, visitors: stats.month_visitors },
    { label: '累计总量', views: stats.total_views, visitors: stats.total_visitors },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-6">网站访问统计</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-2">{c.label}</div>
            <div className="text-2xl font-bold">{c.views}</div>
            <div className="text-xs text-gray-400 mt-1">访问次数</div>
            <div className="text-lg font-semibold mt-2 text-[#2B8C93]">{c.visitors}</div>
            <div className="text-xs text-gray-400">独立访客</div>
          </div>
        ))}
      </div>
    </div>
  );
}
