'use client';
import { useState, useEffect } from 'react';

type Category = {
  id: string;
  slug: string;
  name: { zh?: string; kk?: string; ru?: string };
  parent_id: string | null;
  sort_order: number;
  sort_order_zh: number | null;
  sort_order_kk: number | null;
  status: string;
  icon: string | null;
  icon_color: string | null;
};

const emptyForm = {
  slug: '',
  name_zh: '',
  name_kk: '',
  name_ru: '',
  parent_id: '',
  sort_order: 0,
  icon: '',
  icon_color: '',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/v1/admin/categories').then(r => r.json()).then(d => setCategories(d.data ?? []));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.slug || !form.name_zh) return alert('slug和中文名称必填');

    const body = {
      slug: form.slug,
      name: { zh: form.name_zh, kk: form.name_kk || undefined, ru: form.name_ru || undefined },
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order),
      icon: form.icon || null,
      icon_color: form.icon_color || null,
    };

    if (editingId) {
      await fetch(`/api/v1/admin/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    resetForm();
    load();
  };

  const handleEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name_zh: c.name?.zh ?? '',
      name_kk: c.name?.kk ?? '',
      name_ru: c.name?.ru ?? '',
      parent_id: c.parent_id ?? '',
      sort_order: c.sort_order ?? 0,
      icon: c.icon ?? '',
      icon_color: c.icon_color ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个分类吗？(有子分类会被拦截)')) return;
    const res = await fetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error?.message ?? '删除失败');
    load();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">分类管理</h1>

      <div className="border rounded-lg p-4 mb-6 space-y-3">
        <h2 className="font-semibold">{editingId ? '编辑分类' : '新增分类'}</h2>
        <input
          placeholder="slug (如 food)"
          value={form.slug}
          onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          placeholder="中文名称(必填)"
          value={form.name_zh}
          onChange={(e) => setForm(f => ({ ...f, name_zh: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          placeholder="哈萨克语名称(可选)"
          value={form.name_kk}
          onChange={(e) => setForm(f => ({ ...f, name_kk: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          placeholder="俄语名称(可选)"
          value={form.name_ru}
          onChange={(e) => setForm(f => ({ ...f, name_ru: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          placeholder="icon (emoji或文字, 可选)"
          value={form.icon}
          onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          placeholder="icon背景色 (如 #FF6B6B, 可选)"
          value={form.icon_color}
          onChange={(e) => setForm(f => ({ ...f, icon_color: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          type="number"
          placeholder="排序"
          value={form.sort_order}
          onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="bg-black text-white rounded px-4 py-2 text-sm">
            {editingId ? '保存修改' : '新增'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="border rounded px-4 py-2 text-sm">
              取消编辑
            </button>
          )}
        </div>
      </div>

      <h2 className="font-semibold mb-2">已有分类 ({categories.length})</h2>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="border rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ background: c.icon_color ?? '#EDEFF3' }}
            >
              {c.icon ?? '📁'}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">{c.name?.zh} <span className="text-gray-400">({c.slug})</span></p>
              <p className="text-gray-500 text-xs">排序: {c.sort_order} · {c.status}</p>
            </div>
            <button onClick={() => handleEdit(c)} className="text-xs text-blue-600">编辑</button>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500">删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}