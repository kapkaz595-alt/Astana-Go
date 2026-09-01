'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/v1/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? 'sent' : 'error');
    if (res.ok) setForm({ name: '', email: '', phone: '', message: '' });
  }

  return (
    <div className="max-w-lg mx-auto px-[18px] py-10">
      <h1 className="text-xl font-bold mb-6">联系我们</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] text-[#6B7280] mb-1">您的姓名</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-[12px] text-[#6B7280] mb-1">您的邮箱</label>
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-[12px] text-[#6B7280] mb-1">您的联系电话</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-[12px] text-[#6B7280] mb-1">您的留言</label>
          <textarea required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            className="w-full border border-[#E7E9EE] rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={status === 'sending'}
          className="border border-[#B54B3A] text-[#B54B3A] rounded-lg px-6 py-2 text-sm hover:bg-[#B54B3A] hover:text-white transition">
          {status === 'sending' ? '发送中...' : '发送'}
        </button>
        {status === 'sent' && <p className="text-green-600 text-sm">发送成功，我们会尽快回复您</p>}
        {status === 'error' && <p className="text-red-600 text-sm">发送失败，请稍后重试</p>}
      </form>
    </div>
  );
}
