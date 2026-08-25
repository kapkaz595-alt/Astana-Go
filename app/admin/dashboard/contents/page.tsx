'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ContentItem = {
  id: string; slug: string; content_type: string; status: string;
  content_translations: { locale: string; title: string }[];
};

export default function AdminContentsPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/contents?page_size=50')
      .then((r) => r.json())
      .then((d) => setContents(d.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">内容管理</h1>
        <Link href="/admin/dashboard/contents/new" className="bg-[#14171F] text-white px-4 py-2 rounded-lg text-sm">
          + 新增内容
        </Link>
      </div>

      {loading && <div className="text-sm text-gray-500">加载中…</div>}

      <div className="flex flex-col gap-2">
        {contents.map((c) => {
          const zhTitle = c.content_translations?.find((t) => t.locale === 'zh')?.title ?? c.slug;
          return (
            <div key={c.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{zhTitle}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.slug} · {c.content_type} · {c.status === 'published' ? '已发布' : '草稿'}
                </div>
              </div>
              <Link href={`/admin/dashboard/contents/${c.id}`} className="text-sm text-[#2B8C93]">
                编辑 ›
              </Link>
            </div>
          );
        })}
        {!loading && contents.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-10">暂无内容，点击右上角新增</div>
        )}
      </div>
    </div>
  );
}