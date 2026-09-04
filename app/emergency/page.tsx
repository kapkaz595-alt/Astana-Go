'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface EmergencyNumber {
  id: string;
  name: { zh?: string; kk?: string; ru?: string };
  phone_number: string;
  icon: string | null;
  color: string | null;
  description: { zh?: string; kk?: string; ru?: string } | null;
}

export default function EmergencyPage() {
  const [items, setItems] = useState<EmergencyNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/emergency-numbers')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] mx-auto px-[18px] py-6">
      <Link href="/" className="text-sm text-[#6B7280] mb-4 inline-block">‹ 返回首页</Link>
      <h1 className="text-xl font-extrabold mb-1" style={{ fontFamily: 'Manrope' }}>紧急求助中心</h1>
      <p className="text-sm text-[#6B7280] mb-6">阿斯塔纳官方紧急电话，均可免费拨打</p>

      {loading ? (
        <div className="text-sm text-[#B0B5BF] text-center py-12">加载中...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`tel:${item.phone_number}`}
              className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[#E7E9EE] shadow-sm"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 text-white"
                style={{ background: item.color || '#6B7280' }}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-[15px]">{item.name?.zh}</div>
                {item.description?.zh && (
                  <div className="text-xs text-[#6B7280] mt-[2px]">{item.description.zh}</div>
                )}
              </div>
              <div className="text-2xl font-extrabold tabular-nums" style={{ fontFamily: 'Manrope' }}>
                {item.phone_number}
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-[#FFF7EC] rounded-xl text-xs text-[#8B6D3A] leading-relaxed">
        ⚠️ 拨打112/101时用简短俄语/哈萨克语关键词（地点+事件类型），或请附近本地人协助沟通。虚假报警在哈萨克斯坦属违法行为，可能面临罚款。
      </div>
    </main>
  );
}
