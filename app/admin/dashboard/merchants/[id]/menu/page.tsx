'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface MenuItem {
  id: string;
  name: { zh?: string; kk?: string; ru?: string };
  price: number | null;
  image_url: string | null;
  category: string | null;
  sort_order: number;
}

export default function MerchantMenuPage() {
  const params = useParams();
  const merchantId = params.id as string;

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [nameZh, setNameZh] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/admin/merchants/${merchantId}/menu-items`);
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [merchantId]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'merchants');
    formData.append('entity_id', merchantId);

    const res = await fetch('/api/v1/admin/upload', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    setUploading(false);
    if (json.success) setImageUrl(json.data.url);
  };

  const handleAdd = async () => {
    if (!nameZh) return;
    const res = await fetch(`/api/v1/admin/merchants/${merchantId}/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: { zh: nameZh },
        price: price ? Number(price) : null,
        image_url: imageUrl || null,
        category: category || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setNameZh('');
      setPrice('');
      setCategory('');
      setImageUrl('');
      fetchItems();
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('确定删除该菜单项？')) return;
    const res = await fetch(`/api/v1/admin/merchants/${merchantId}/menu-items/${itemId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.success) fetchItems();
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">菜单套餐管理</h1>

      {/* 新增表单 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col gap-3">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="菜品名称（中文）"
          value={nameZh}
          onChange={(e) => setNameZh(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="价格（坚戈）"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="分类（如：招牌菜/套餐/饮品）"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          />
          {uploading && <span className="text-xs text-gray-400 ml-2">上传中...</span>}
          {imageUrl && (
            <img src={imageUrl} alt="预览" className="w-20 h-20 object-cover rounded mt-2" />
          )}
        </div>
        <button
          onClick={handleAdd}
          className="bg-[#D9A441] text-white rounded px-4 py-2 text-sm font-medium w-fit"
        >
          添加菜单项
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-sm text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {item.image_url && (
                <img src={item.image_url} alt={item.name?.zh} className="w-full aspect-square object-cover" />
              )}
              <div className="p-2">
                <div className="text-sm font-medium">{item.name?.zh}</div>
                {item.price && <div className="text-xs text-[#D9A441]">{item.price} 坚戈</div>}
                {item.category && <div className="text-xs text-gray-400">{item.category}</div>}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-500 mt-2"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
