import { Node, mergeAttributes } from '@tiptap/core';

export const RecommendCard = Node.create({
  name: 'recommendCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      image: { default: null },
      title: { default: '' },
      desc: { default: '' },
      link: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-recommend-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { image, title, desc, link } = HTMLAttributes;
    const target = link?.startsWith('http') ? '_blank' : '_self';
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-recommend-card': 'true' }),
      [
        'a',
        {
          href: link,
          target,
          style:
            'display:flex;align-items:stretch;text-decoration:none;color:inherit;border:1px solid #E7E9EE;border-radius:14px;overflow:hidden;margin:16px 0;box-shadow:0 1px 6px rgba(20,23,31,0.08);',
        },
        ...(image
          ? [['img', { src: image, style: 'width:35%;min-width:100px;max-width:180px;object-fit:cover;flex-shrink:0;' }]]
          : []),
        [
          'div',
          { style: 'padding:14px 16px;flex:1;display:flex;flex-direction:column;justify-content:center;' },
          ['div', { style: 'font-weight:800;font-size:15px;color:#14171F;line-height:1.4;' }, title],
          ...(desc ? [['div', { style: 'font-size:12px;color:#6B7280;margin-top:6px;line-height:1.5;' }, desc]] : []),
          ['div', { style: 'display:inline-block;background:#B54B3A;color:#fff;font-size:12px;font-weight:700;padding:7px 16px;border-radius:999px;margin-top:10px;width:fit-content;' }, '立即阅读 →'],
        ],
      ],
    ];
  },
});
