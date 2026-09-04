'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useState } from 'react';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [cardUploading, setCardUploading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardImage, setCardImage] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardLink, setCardLink] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Image, TextStyle, Color, Link.configure({ openOnClick: false })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] border rounded-lg px-3 py-2 focus:outline-none',
      },
    },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'contents');
      const res = await fetch('/api/v1/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleCardImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCardUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'contents');
      const res = await fetch('/api/v1/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setCardImage(data.url);
    } finally {
      setCardUploading(false);
      e.target.value = '';
    }
  }

  function insertCard() {
    if (!editor || !cardTitle || !cardLink) return;
    const target = cardLink.startsWith('http') ? '_blank' : '_self';
    const html = `
      <a href="${cardLink}" target="${target}" style="display:block;text-decoration:none;color:inherit;border:1px solid #E7E9EE;border-radius:14px;overflow:hidden;margin:16px 0;box-shadow:0 1px 6px rgba(20,23,31,0.08);">
        ${cardImage ? `<img src="${cardImage}" style="width:100%;height:160px;object-fit:cover;display:block;" />` : ''}
        <div style="padding:14px 16px;">
          <div style="font-weight:800;font-size:15px;color:#14171F;line-height:1.4;">${cardTitle}</div>
          ${cardDesc ? `<div style="font-size:12px;color:#6B7280;margin-top:6px;line-height:1.5;">${cardDesc}</div>` : ''}
          <div style="display:inline-block;background:#B54B3A;color:#fff;font-size:12px;font-weight:700;padding:7px 16px;border-radius:999px;margin-top:10px;">立即阅读 →</div>
        </div>
      </a>
      <p></p>
    `;
    editor.chain().focus().insertContent(html).run();
    setShowCardForm(false);
    setCardImage('');
    setCardTitle('');
    setCardDesc('');
    setCardLink('');
  }
  if (!editor) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`text-xs px-2 py-1 rounded border ${editor.isActive('bold') ? 'bg-[#14171F] text-white' : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`text-xs px-2 py-1 rounded border italic ${editor.isActive('italic') ? 'bg-[#14171F] text-white' : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setColor('#B54B3A').run()}
          className="text-xs px-2 py-1 rounded border text-[#B54B3A] font-semibold"
        >
          红色
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="text-xs px-2 py-1 rounded border"
        >
          默认色
        </button>
        <label className="text-xs px-2 py-1 rounded border cursor-pointer">
          {uploading ? '上传中…' : '插入图片'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowCardForm((v) => !v)}
          className="text-xs px-2 py-1 rounded border"
        >
          插入推荐卡片
        </button>
      </div>

      {showCardForm && (
        <div className="border rounded-lg p-3 mb-2 flex flex-col gap-2 bg-gray-50">
          <div>
            <label className="text-xs font-medium block mb-1">卡片图片</label>
            {cardImage ? (
              <div className="relative w-20 h-20">
                <img src={cardImage} className="w-full h-full object-cover rounded" />
                <button type="button" onClick={() => setCardImage('')}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ) : (
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                     onChange={handleCardImageUpload} disabled={cardUploading} />
            )}
          </div>
          <input
            placeholder="标题 *"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />
          <input
            placeholder="简介（可选）"
            value={cardDesc}
            onChange={(e) => setCardDesc(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />
          <input
            placeholder="链接：/merchants/店铺slug 或 https://外部网址 *"
            value={cardLink}
            onChange={(e) => setCardLink(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button type="button" onClick={insertCard}
                    className="text-xs px-3 py-1 rounded bg-[#14171F] text-white">插入</button>
            <button type="button" onClick={() => setShowCardForm(false)}
                    className="text-xs px-3 py-1 rounded border">取消</button>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
