'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeSelect from '../_components/TimeSelect';

const WEEKDAYS = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
];

type Category = { id: string; slug: string; name: Record<string, string> };

export default function NewMerchantPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/v1/categories?locale=zh')
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []));
  }, []);

  const [form, setForm] = useState({
    slug: '',
    name_zh: '', name_ru: '', name_kk: '',
    description_zh: '',
    business_type: 'local_merchant',
    phone: '',
    whatsapp: '',
    address: '',
    latitude: '',
    longitude: '',
    twogis_url: '',
  });

  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(WEEKDAYS.map((d) => [d.key, { open: '09:00', close: '22:00', closed: false }]))
  );

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'merchants');
  formData.append('entity_id', form.slug || 'temp');

  const res = await fetch('/api/v1/admin/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  setUploading(false);
  if (data.url) {
    setCoverImage(data.url);
  } else {
    setError('图片上传失败');
  }
}

  function updateHour(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const business_hours: Record<string, { open: string; close: string }[]> = {};
    for (const d of WEEKDAYS) {
      business_hours[d.key] = hours[d.key].closed ? [] : [{ open: hours[d.key].open, close: hours[d.key].close }];
    }

    const body = {
  slug: form.slug,
  cover_image: coverImage || null,
  name: { zh: form.name_zh, ru: form.name_ru, kk: form.name_kk },
  description: { zh: form.description_zh },
  business_type: form.business_type,
  phone: form.phone || null,
  whatsapp: form.whatsapp || null,
  address: form.address || null,
  latitude: form.latitude ? parseFloat(form.latitude) : null,
  longitude: form.longitude ? parseFloat(form.longitude) : null,
  '2gis_url': form.twogis_url || null,
  business_hours,
  business_status: 'active',
  category_ids: selectedCategoryIds,
};

    const res = await fetch('/api/v1/admin/merchants', {
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
    router.push('/admin/dashboard/merchants');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/dashboard/merchants" className="text-sm text-gray-500">‹ 返回商家列表</Link>
      <h1 className="text-xl font-bold mt-2 mb-6">新增商家</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Slug（英文标识，如 cafe-astana）*</label>
          <input required value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
  <label className="text-sm font-medium block mb-1">封面图</label>
  <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
  {uploading && <span className="text-xs text-gray-400 ml-2">上传中…</span>}
  {coverImage && (
    <img src={coverImage} alt="预览" className="mt-2 w-32 h-20 object-cover rounded-lg border" />
  )}
</div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">店名（中文）*</label>
            <input required value={form.name_zh} onChange={(e) => updateField('name_zh', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">店名（俄语）</label>
            <input value={form.name_ru} onChange={(e) => updateField('name_ru', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">店名（哈萨克语）</label>
            <input value={form.name_kk} onChange={(e) => updateField('name_kk', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">简介</label>
          <textarea value={form.description_zh} onChange={(e) => updateField('description_zh', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">商家类型</label>
          <select value={form.business_type} onChange={(e) => updateField('business_type', e.target.value)}
         className="w-full border rounded-lg px-3 py-2 text-sm">
         <option value="local_merchant">本地商家</option>
         <option value="business_service">商业服务</option>
         </select>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">电话</label>
            <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                   placeholder="+7..." className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)}
                   placeholder="+7..." className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">地址</label>
          <input value={form.address} onChange={(e) => updateField('address', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">纬度 latitude</label>
            <input value={form.latitude} onChange={(e) => updateField('latitude', e.target.value)}
                   placeholder="51.128" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">经度 longitude</label>
            <input value={form.longitude} onChange={(e) => updateField('longitude', e.target.value)}
                   placeholder="71.43" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">2GIS链接</label>
          <input value={form.twogis_url} onChange={(e) => updateField('twogis_url', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">营业时间</label>
          <div className="flex flex-col gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d.key} className="flex items-center gap-2 text-sm">
                <span className="w-10 shrink-0">{d.label}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={hours[d.key].closed}
                         onChange={(e) => updateHour(d.key, 'closed', e.target.checked)} />
                  休息
                </label>
                {!hours[d.key].closed && (
  <>
    <TimeSelect value={hours[d.key].open} onChange={(v) => updateHour(d.key, 'open', v)} />
    <span>-</span>
    <TimeSelect value={hours[d.key].close} onChange={(v) => updateHour(d.key, 'close', v)} />
  </>
)}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={saving}
                className="bg-[#14171F] text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50">
          {saving ? '保存中…' : '保存商家'}
        </button>
      </form>
    </div>
  );
}