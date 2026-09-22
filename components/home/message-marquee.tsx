'use client';

import { useEffect, useState } from 'react';

type Msg = { id: string; content: string; nickname: string };

export function MessageMarquee() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  const current = messages[index];

  return (
    <>
      <div className="mx-[18px] mb-4 rounded-xl bg-orange-50 px-4 py-3 flex items-center justify-between gap-3">
        {current ? (
          <div key={current.id} className="flex-1 min-w-0">
            <p className="text-[11px] text-[#6B7280] mb-0.5">{current.nickname} 说：</p>
            <p className="text-[13px] text-[#14171F] truncate">{current.content}</p>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#6B7280]">还没有留言，来说两句吧～</p>
          </div>
        )}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setShowForm(true)} className="text-xs text-[#E8722C] font-medium whitespace-nowrap">
            我要留言
          </button>
          {messages.length > 0 && (
            <button onClick={openAll} className="text-xs text-[#6B7280] whitespace-nowrap">
              查看全部
            </button>
          )}
        </div>
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

      {showForm && <MessageForm onClose={() => setShowForm(false)} />}
    </>
  );
}

function MessageForm({ onClose }: { onClose: () => void }) {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!content.trim()) {
      setError('请输入留言内容');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, nickname }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || '提交失败');
      } else {
        setDone(true);
      }
    } catch {
      setError('网络错误，请稍后再试');
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-[480px] mx-auto rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-[15px]">发条留言</h3>
          <button onClick={onClose} className="text-[#9AA0AC] text-lg">✕</button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-[14px] text-[#14171F] font-medium">留言已提交</p>
            <p className="text-[12px] text-[#6B7280] mt-1">审核通过后会展示在首页</p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 bg-[#E8722C] text-white text-sm rounded-full"
            >
              好的
            </button>
          </div>
        ) : (
          <>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="昵称（选填，最多20字）"
              maxLength={20}
              className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm mb-2 outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="说点什么吧（最多100字）"
              maxLength={100}
              rows={3}
              className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm outline-none resize-none"
            />
            <div className="text-right text-[10px] text-[#9AA0AC] mt-1">{content.length}/100</div>

            {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full mt-3 py-2.5 bg-[#E8722C] text-white text-sm font-medium rounded-full disabled:opacity-60"
            >
              {submitting ? '提交中...' : '提交'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
