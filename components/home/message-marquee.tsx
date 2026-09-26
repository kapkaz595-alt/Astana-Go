'use client';

import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/utils/device-id';

type Reply = { id: string; content: string; nickname: string; created_at: string; like_count?: number };
type Msg = { id: string; content: string; nickname: string; like_count?: number; created_at?: string; replies?: Reply[] };

export function MessageMarquee() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [allList, setAllList] = useState<Msg[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyNickname, setReplyNickname] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyDoneId, setReplyDoneId] = useState<string | null>(null);

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
    fetch('/api/v1/messages/approved?page=1&limit=100')
      .then((r) => r.json())
      .then((d) => setAllList(d.data ?? []));
    setShowAll(true);
  }

  async function handleLike(messageId: string, isReply: boolean, parentId?: string) {
  const deviceId = getDeviceId();
  const res = await fetch(`/api/v1/messages/${messageId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  });
  if (res.ok) {
    setAllList((list) =>
      list.map((m) => {
        if (!isReply && m.id === messageId) {
          return { ...m, like_count: (m.like_count ?? 0) + 1 };
        }
        if (isReply && m.id === parentId) {
          return {
            ...m,
            replies: (m.replies ?? []).map((r) =>
              r.id === messageId ? { ...r, like_count: (r.like_count ?? 0) + 1 } : r
            ),
          };
        }
        return m;
      })
    );
  }
}

  async function submitReply(parentId: string) {
    if (!replyContent.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/v1/messages/${parentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, nickname: replyNickname }),
      });
      if (res.ok) {
        setReplyDoneId(parentId);
        setReplyContent('');
        setReplyNickname('');
      }
    } catch {}
    setReplySubmitting(false);
  }

  const current = messages[index];

  return (
    <>
      <div className="mx-[18px] mt-4 mb-5">
        <div className="rounded-2xl bg-gradient-to-r from-[#FFF3E6] to-[#FFEBDA] border border-[#FFD9B8] px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#F4A83D] flex items-center justify-center text-white text-sm shrink-0">
            💬
          </div>
          {current ? (
            <div key={current.id} className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold text-[#B45F1E] mb-0.5">{current.nickname}</p>
              <p className="text-[12.5px] text-[#4A4A4A] truncate">{current.content}</p>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#8A6A4A]">还没有留言，来说两句吧～</p>
            </div>
          )}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => setShowForm(true)}
              className="text-[11px] font-semibold text-white bg-[#E8722C] rounded-full px-3 py-1 whitespace-nowrap"
            >
              我要留言
            </button>
            {messages.length > 0 && (
              <button onClick={openAll} className="text-[10px] text-[#9AA0AC] whitespace-nowrap">
                查看全部 ›
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#9AA0AC] text-center mt-1.5">
          文明留言，理性发言
        </p>
      </div>

      {showAll && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowAll(false)}>
          <div
            className="bg-white w-full max-w-[420px] max-h-[75vh] rounded-2xl overflow-y-auto p-4"
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
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-[#9AA0AC]">
                      {m.created_at && new Date(m.created_at).toLocaleString('zh-CN')}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}
                        className="text-[11px] text-[#6B7280]"
                      >
                        回复
                      </button>
                      <button
                        onClick={() => handleLike(m.id, false)}
                        className="text-[11px] text-[#6B7280] flex items-center gap-1"
                      >
                        👍 {m.like_count ?? 0}
                      </button>
                    </div>
                  </div>

                  {/* 回复列表 */}
                  {(m.replies ?? []).length > 0 && (
                    <div className="mt-2 ml-3 pl-2 border-l-2 border-[#F0F0F0] space-y-2">
                      {m.replies!.map((r) => (
                        <div key={r.id}>
                          <p className="text-[10.5px] text-[#6B7280]">{r.nickname}</p>
                          <p className="text-[12px] text-[#14171F] mt-0.5">{r.content}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[9.5px] text-[#9AA0AC]">
                              {new Date(r.created_at).toLocaleString('zh-CN')}
                            </p>
                            <button
                              onClick={() => handleLike(r.id, true, m.id)}
                              className="text-[10px] text-[#6B7280] flex items-center gap-1"
                            >
                              👍 {r.like_count ?? 0}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 回复输入框 */}
                  {replyingTo === m.id && (
                    <div className="mt-2 ml-3">
                      {replyDoneId === m.id ? (
                        <p className="text-[11px] text-[#6B7280]">回复已提交，审核通过后展示</p>
                      ) : (
                        <>
                          <input
                            value={replyNickname}
                            onChange={(e) => setReplyNickname(e.target.value)}
                            placeholder="昵称（选填）"
                            maxLength={20}
                            className="w-full border border-[#E7E9EE] rounded-lg px-2 py-1.5 text-[12px] mb-1 outline-none"
                          />
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="说点什么吧"
                            maxLength={100}
                            rows={2}
                            className="w-full border border-[#E7E9EE] rounded-lg px-2 py-1.5 text-[12px] outline-none resize-none"
                          />
                          <button
                            onClick={() => submitReply(m.id)}
                            disabled={replySubmitting}
                            className="mt-1 px-3 py-1 bg-[#E8722C] text-white text-[11px] rounded-full disabled:opacity-60"
                          >
                            {replySubmitting ? '提交中...' : '提交回复'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
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
