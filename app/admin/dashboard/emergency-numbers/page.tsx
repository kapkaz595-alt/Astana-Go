'use client';

import { useEffect, useState } from 'react';

interface EmergencyNumber {
  id: string;
  name: { zh?: string; kk?: string; ru?: string };
  phone_number: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function EmergencyNumbersPage() {
  const [items, setItems] = useState<EmergencyNumber[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameZh, setNameZh] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/admin/emergency-numbers');
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    if (!nameZh || !phoneNumber) return;
    const res = await fetch('/api/v1/admin/emergency-numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: { zh: nameZh },
        phone_number: phoneNumber,
        icon: icon || null,
        sort_order: Number(sortOrder) || 0,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setNameZh('');
      setPhoneNumber('');
      setIcon('');
      setSortOrder('0');
      fetchItems();
    }
  };

  const handleToggleActive = async (item: EmergencyNumber) => {
    const res = await fetch(`/api/v1/admin/emergency-numbers/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    const json = await res.json();
    if (json.success) fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该号码？')) return;
    const res = await fetch(`/api/v1/admin/emergency-numbers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) fetchItems();
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">紧急求助号码管理</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col gap-3">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="名称（如：报警/急救/消防）"
          value={nameZh}
          onChange={(e) => setNameZh(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="号码（如：102）"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="图标（可选，如emoji：🚓）"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="排序（数字越小越靠前）"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-[#14171F] text-white rounded px-4 py-2 text-sm font-medium w-fit"
        >
          添加号码
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">加载中...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <div>
                  <div className="text-sm font-medium">{item.name?.zh}</div>
                  <div className="text-xs text-gray-400">{item.phone_number} · 排序{item.sort_order}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(item)}
                  className={`text-xs px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {item.is_active ? '已启用' : '已停用'}
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500">
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
