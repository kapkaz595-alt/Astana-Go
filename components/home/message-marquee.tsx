'use client';

import { useEffect, useState } from 'react';

type Msg = { id: string; content: string; nickname: string };

export function MessageMarquee() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [allList, setAllList] = useState<(Msg & { created_at: string })[]>([]);

  useEffect(() => {
    fetch('/api/v1/messages/approved?page=1&limit=20')
      .then((r) => r.json())
      .then((d) => setMessages(d.data ?? []));
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages]);

  function openAll() {
    fetch('/api/v1/messages/approved?page=1&limit=50')
      .then((r) => r.json())
      .then((d) => setAllList(d.data ?? []));
    setShowAll(true);
  }

  if (messages.length === 0) return null;
  const current = messages[index];

  return (
    <>
      <div className="mx-[18px] mb-4 rounded-xl bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
        <div key={current.id} className="flex-1 min-w-0">
          <p className="text-[11px] text-[#6B7280] mb-0.5">{current.nickname} 说：</p>
          <p className="text-[13px] text-[#14171F] truncate">{current.content}</p>
        </div>
        <button onClick={openAll} className="text-xs text-[#E8722C] whitespace-nowrap shrink-0 font-medium">
          查看全部
        </button>
      </div>

      {showAll && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAll(false)}>
          <div
            className="bg-white w-full max-w-[480px] mx-auto max-h-[75vh] rounded-t-2xl overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[15px]">全部留言</h3>
              <button onClick={() => setShowAll(false)} className="text-[#9AA0AC] text-lg">✕</button>
            </div>
            <div className="space-y-3">
              {allList.map((m) => (
                <div key={m.id} className="border-b border-[#E7E9EE] pb-2">
                  <p className="text-[11px] text-[#6B7280]">{m.nickname}</p>
                  <p className="text-[13px] text-[#14171F] mt-0.5">{m.content}</p>
                  <p className="text-[10px] text-[#9AA0AC] mt-1">
                    {new Date(m.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))}
              {allList.length === 0 && (
                <p className="text-sm text-[#9AA0AC] text-center py-6">暂无留言</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
