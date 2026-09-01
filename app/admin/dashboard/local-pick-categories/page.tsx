'use client';
import { useState, useEffect } from 'react';

type LocalPickCategory = {
  id: string;
  slug: string;
  name: { zh?: string; kk?: string; ru?: string };
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  slug: '',
  name_zh: '',
  name_kk: '',
  name_ru: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminLocalPickCategoriesPage() {
  const [categories, setCategories] = useState<LocalPickCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    fetch('/api/v1/admin/local-pick-categories').then(r => r.json()).then(d => setCategories(d.data ?? []));
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
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    if (editingId) {
      await fetch(`/api/v1/admin/local-pick-categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/v1/admin/local-pick-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    resetForm();
    load();
  };

  const handleEdit = (c: LocalPickCategory) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      name_zh: c.name?.zh ?? '',
      name_kk: c.name?.kk ?? '',
      name_ru: c.name?.ru ?? '',
      sort_order: c.sort_order ?? 0,
      is_active: c.is_active ?? true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个分类吗？')) return;
    const res = await fetch(`/api/v1/admin/local-pick-categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error?.message ?? '删除失败');
    load();
  };

  const toggleActive = async (c: LocalPickCategory) => {
    await fetch(`/api/v1/admin/local-pick-categories/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    load();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">本地精选分类管理</h1>

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
          type="number"
          placeholder="排序"
          value={form.sort_order}
          onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
          />
          启用
        </label>
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
            <div className="flex-1 text-sm">
              <p className="font-medium">
                {c.name?.zh} <span className="text-gray-400">({c.slug})</span>
                {!c.is_active && <span className="ml-2 text-red-500">已禁用</span>}
              </p>
              <p className="text-gray-400">排序:{c.sort_order}</p>
            </div>
            <button onClick={() => toggleActive(c)} className="border rounded px-3 py-1 text-sm">
              {c.is_active ? '禁用' : '启用'}
            </button>
            <button onClick={() => handleEdit(c)} className="border rounded px-3 py-1 text-sm">
              编辑
            </button>
            <button onClick={() => handleDelete(c.id)} className="border rounded px-3 py-1 text-sm text-red-500">
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
