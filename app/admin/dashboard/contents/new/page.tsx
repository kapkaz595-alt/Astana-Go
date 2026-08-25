'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Category = { id: string; slug: string; name: Record<string, string> };

export default function NewContentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    slug: '',
    content_type: 'guide',
    status: 'published',
    cover_image: '',
    title_zh: '',
    body_zh: '',
    meta_description_zh: '',
  });

  useEffect(() => {
    fetch('/api/v1/categories?locale=zh').then((r) => r.json()).then((d) => setCategories(d.data ?? []));
  }, []);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      slug: form.slug,
      content_type: form.content_type,
      status: form.status,
      cover_image: form.cover_image || null,
      translations: [
        {
          locale: 'zh',
          title: form.title_zh,
          body: form.body_zh,
          meta_description: form.meta_description_zh || null,
        },
      ],
      category_ids: selectedCategoryIds,
    };

    const res = await fetch('/api/v1/admin/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error?.message ?? '保存失败');
      return;
    }
    router.push('/admin/dashboard/contents');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/dashboard/contents" className="text-sm text-gray-500">‹ 返回内容列表</Link>
      <h1 className="text-xl font-bold mt-2 mb-6">新增内容</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Slug（英文标识）*</label>
          <input required value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">标题（中文）*</label>
          <input required value={form.title_zh} onChange={(e) => updateField('title_zh', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">正文（中文）*</label>
          <textarea required value={form.body_zh} onChange={(e) => updateField('body_zh', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={8} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">SEO简介（可选）</label>
          <textarea value={form.meta_description_zh} onChange={(e) => updateField('meta_description_zh', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">内容类型</label>
            <select value={form.content_type} onChange={(e) => updateField('content_type', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="guide">攻略</option>
              <option value="article">文章</option>
              <option value="list">榜单</option>
              <option value="ranking">排行</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">状态</label>
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">封面图URL（可选）</label>
          <input value={form.cover_image} onChange={(e) => updateField('cover_image', e.target.value)}
                 placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">所属分类（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-1 text-xs border rounded-full px-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategoryIds((prev) => [...prev, c.id]);
                    } else {
                      setSelectedCategoryIds((prev) => prev.filter((id) => id !== c.id));
                    }
                  }}
                />
                {c.name?.zh ?? c.slug}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={saving}
                className="bg-[#14171F] text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50">
          {saving ? '保存中…' : '保存内容'}
        </button>
      </form>
    </div>
  );
}