'use client';

import { useEffect, useState } from 'react';

interface Msg {
  id: string;
  content: string;
  nickname: string;
  status: string;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/admin/messages?status=${filter}`);
    const json = await res.json();
    if (json.success) setMessages(json.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    await fetch('/api/v1/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('确认删除？')) return;
    await fetch(`/api/v1/admin/messages?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">留言管理</h2>
      <p className="text-sm text-slate-500 mb-6">审核用户提交的首页留言</p>

      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              filter === f
                ? 'bg-[#D9A441] text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {f === 'pending' ? '待审核' : f === 'approved' ? '已通过' : f === 'rejected' ? '已拒绝' : '全部'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">加载中...</div>
      ) : messages.length === 0 ? (
        <div className="text-sm text-slate-400 bg-white rounded-lg border border-slate-200 p-8 text-center">
          暂无留言
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500">
                    {m.nickname} · {new Date(m.created_at).toLocaleString('zh-CN')}
                  </p>
                  <p className="text-sm text-slate-900 mt-1">{m.content}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700'
                      : m.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {m.status === 'pending' ? '待审核' : m.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                {m.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(m.id, 'approved')}
                    className="text-xs font-medium text-green-700 border border-green-200 bg-green-50 rounded-md px-3 py-1.5"
                  >
                    通过
                  </button>
                )}
                {m.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(m.id, 'rejected')}
                    className="text-xs font-medium text-red-700 border border-red-200 bg-red-50 rounded-md px-3 py-1.5"
                  >
                    拒绝
                  </button>
                )}
                <button
                  onClick={() => remove(m.id)}
                  className="text-xs font-medium text-slate-500 border border-slate-200 bg-slate-50 rounded-md px-3 py-1.5"
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
