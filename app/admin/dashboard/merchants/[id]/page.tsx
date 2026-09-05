'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import TimeSelect from '../_components/TimeSelect';
import imageCompression from 'browser-image-compression';

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

export default function EditMerchantPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

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
    business_status: 'active',
    verification_status: 'unverified',
  });

  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(WEEKDAYS.map((d) => [d.key, { open: '09:00', close: '22:00', closed: false }]))
  );

  useEffect(() => {
    fetch('/api/v1/categories?locale=zh').then((r) => r.json()).then((d) => setCategories(d.data ?? []));

    fetch(`/api/v1/admin/merchants/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setError('加载失败');
          setLoading(false);
          return;
        }
        const m = d.data;
        setForm({
          slug: m.slug ?? '',
          name_zh: m.name?.zh ?? '',
          name_ru: m.name?.ru ?? '',
          name_kk: m.name?.kk ?? '',
          description_zh: m.description?.zh ?? '',
          business_type: m.business_type ?? 'local_merchant',
          phone: m.phone ?? '',
          whatsapp: m.whatsapp ?? '',
          address: m.address ?? '',
          latitude: m.latitude?.toString() ?? '',
          longitude: m.longitude?.toString() ?? '',
          twogis_url: m['2gis_url'] ?? '',
          business_status: m.business_status ?? 'active',
          verification_status: m.verification_status ?? 'unverified',
        });

        setCoverImage(m.cover_image ?? '');
        setGalleryImages(m.gallery_images ?? []);
        setIsFeatured(m.is_featured ?? false);
        if (m.business_hours) {
          const h: Record<string, { open: string; close: string; closed: boolean }> = {};
          for (const d of WEEKDAYS) {
            const slots = m.business_hours[d.key];
            if (slots && slots.length > 0) {
              h[d.key] = { open: slots[0].open, close: slots[0].close, closed: false };
            } else {
              h[d.key] = { open: '09:00', close: '22:00', closed: true };
            }
          }
          setHours(h);
        }

        const existingCatIds = (m.merchant_categories ?? []).map((mc: { category_id: string }) => mc.category_id);
        setSelectedCategoryIds(existingCatIds);
        setLoading(false);
      });
  }, [id]);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateHour(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));
  }

  async function compressImage(file: File): Promise<File> {
    try {
      return await imageCompression(file, {
        maxWidthOrHeight: 1600,
        maxSizeMB: 0.5,
        useWebWorker: true,
        fileType: 'image/webp',
      });
    } catch (err) {
      console.error('压缩失败，使用原图', err);
      return file;
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    const file = await compressImage(rawFile);
    setCoverUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'merchants');
    formData.append('entity_id', id);

    const res = await fetch('/api/v1/admin/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setCoverUploading(false);
    if (data.url) {
      setCoverImage(data.url);
    } else {
      setError('封面图上传失败');
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'merchants');
        const res = await fetch('/api/v1/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) uploadedUrls.push(data.url);
      }
      setGalleryImages((prev) => [...prev, ...uploadedUrls]);
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryImage(index: number) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
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
      business_status: form.business_status,
      verification_status: form.verification_status,
      category_ids: selectedCategoryIds,
      gallery_images: galleryImages,
      is_featured: isFeatured,
    };

    const res = await fetch(`/api/v1/admin/merchants/${id}`, {
      method: 'PATCH',
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

  async function handleDelete() {
    if (!confirm('确定删除这个商家吗？此操作不可撤销。')) return;
    const res = await fetch(`/api/v1/admin/merchants/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) {
      setError(data.error?.message ?? '删除失败');
      return;
    }
    router.push('/admin/dashboard/merchants');
  }

  if (loading) return <div className="p-6">加载中…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/admin/dashboard/merchants" className="text-sm text-gray-500">‹ 返回商家列表</Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <h1 className="text-xl font-bold">编辑商家</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/dashboard/merchants/${id}/menu`} className="text-sm text-[#2B8C93]">
            管理菜单套餐 ›
          </Link>
          <button onClick={handleDelete} className="text-sm text-red-600">删除商家</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Slug（英文标识）*</label>
          <input required value={form.slug} onChange={(e) => updateField('slug', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">封面图</label>
          <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-sm" disabled={coverUploading} />
          {coverUploading && <span className="text-xs text-gray-400 ml-2">上传中…</span>}
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
                      setSelectedCategoryIds((prev) => prev.filter((cid) => cid !== c.id));
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
            <label className="text-sm font-medium block mb-1">营业状态</label>
            <select value={form.business_status} onChange={(e) => updateField('business_status', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="active">营业中</option>
              <option value="inactive">未激活</option>
              <option value="suspended">已暂停</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">认证状态</label>
            <select value={form.verification_status} onChange={(e) => updateField('verification_status', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="unverified">待认证</option>
              <option value="verified">已认证</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium">设为首页热门推荐</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">电话</label>
            <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">WhatsApp</label>
            <input value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
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
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">经度 longitude</label>
            <input value={form.longitude} onChange={(e) => updateField('longitude', e.target.value)}
                   className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">2GIS链接</label>
          <input value={form.twogis_url} onChange={(e) => updateField('twogis_url', e.target.value)}
                 className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">相册图片（多选）</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleGalleryUpload}
            disabled={galleryUploading}
          />
          {galleryUploading && <p className="text-sm text-gray-500">上传中…</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {galleryImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="w-20 h-20 object-cover rounded" />
                <button type="button" onClick={() => removeGalleryImage(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
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
          {saving ? '保存中…' : '保存修改'}
        </button>
      </form>
    </div>
  );
}
