'use client';
import { useState, useEffect } from 'react';

type Banner = {
  id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ image_url: '', link_url: '', sort_order: 0 });

  const loadBanners = () => {
    fetch('/api/v1/admin/banners').then(r => r.json()).then(d => setBanners(d.data ?? []));
  };

  useEffect(() => { loadBanners(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'banners');
    const res = await fetch('/api/v1/admin/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.url) setForm(f => ({ ...f, image_url: data.url }));
  };

  const handleAdd = async () => {
    if (!form.image_url) return alert('请先上传图片');
    await fetch('/api/v1/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ image_url: '', link_url: '', sort_order: 0 });
    loadBanners();
  };

  const toggleActive = async (b: Banner) => {
    await fetch(`/api/v1/admin/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
    loadBanners();
  };

 const handleDelete = async (id: string) => {
  if (!confirm('确定删除这条广告吗？')) return;
  const res = await fetch(`/api/v1/admin/banners/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) {
    alert(data.error?.message || '删除失败');
    return;
  }
  loadBanners();
};

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">广告位管理</h1>

      <div className="border rounded-lg p-4 mb-6 space-y-3">
        <h2 className="font-semibold">新增广告</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        {uploading && <p className="text-sm text-gray-500">上传中...</p>}
        {form.image_url && <img src={form.image_url} className="h-24 rounded" />}
        <input
          placeholder="跳转链接(可选)"
          value={form.link_url}
          onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <input
          type="number"
          placeholder="排序(数字越小越靠前)"
          value={form.sort_order}
          onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
          className="border rounded px-3 py-2 w-full text-sm"
        />
        <button onClick={handleAdd} className="bg-black text-white rounded px-4 py-2 text-sm">
          新增
        </button>
      </div>

      <h2 className="font-semibold mb-2">已有广告 ({banners.length})</h2>
      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="border rounded-lg p-3 flex items-center gap-3">
            <img src={b.image_url} className="w-24 h-16 object-cover rounded" />
            <div className="flex-1 text-sm">
              <p className="text-gray-500">排序: {b.sort_order}</p>
              <p className="text-gray-500 truncate">{b.link_url || '无链接'}</p>
            </div>
            <button
              onClick={() => toggleActive(b)}
              className={`text-xs px-2 py-1 rounded ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {b.is_active ? '已启用' : '已停用'}
            </button>
            <button onClick={() => handleDelete(b.id)} className="text-xs text-red-500">删除</button>
          </div>
        ))}
      </div>
    </div>
  );
}
