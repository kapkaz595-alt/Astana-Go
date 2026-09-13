'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Merchant = {
  id: string; slug: string; name: Record<string, string>;
  business_status: string; verification_status: string; view_count: number;
};

type Category = {
  id: string;
  slug: string;
  name: string;
};

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');

  // 拉取分类列表（只需一次）
  useEffect(() => {
    fetch('/api/v1/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  // 根据当前选中分类拉取商家列表
  useEffect(() => {
    setLoading(true);
    const url =
      activeCategoryId === 'all'
        ? '/api/v1/admin/merchants?page_size=50'
        : `/api/v1/admin/merchants?page_size=50&category_id=${activeCategoryId}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => setMerchants(d.data ?? []))
      .finally(() => setLoading(false));
  }, [activeCategoryId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">商家管理</h1>
        <Link href="/admin/dashboard/merchants/new" className="bg-[#14171F] text-white px-4 py-2 rounded-lg text-sm">
          + 新增商家
        </Link>
      </div>

      {/* 分类Tab */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
        <button
          onClick={() => setActiveCategoryId('all')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm ${
            activeCategoryId === 'all'
              ? 'bg-[#14171F] text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategoryId(c.id)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm ${
              activeCategoryId === c.id
                ? 'bg-[#14171F] text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">加载中…</div>}

      <div className="flex flex-col gap-2">
        {merchants.map((m) => (
          <div key={m.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{m.name?.zh ?? m.slug}</div>
              <div className="text-xs text-gray-500 mt-1">
                {m.slug} · {m.business_status === 'active' ? '营业中' : '未激活'} ·
                {m.verification_status === 'verified' ? ' 已认证' : ' 待认证'} · 浏览{m.view_count}
              </div>
            </div>
            <Link href={`/admin/dashboard/merchants/${m.id}`} className="text-sm text-[#2B8C93]">
              编辑 ›
            </Link>
          </div>
        ))}
        {!loading && merchants.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-10">暂无商家，点击右上角新增</div>
        )}
      </div>
    </div>
  );
}
