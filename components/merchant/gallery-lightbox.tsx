'use client';

import { useState, useEffect, useCallback } from 'react';

export default function GalleryLightbox({ images, name }: { images: string[]; name: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, prev, next]);

  return (
  <>
    <div className="grid grid-cols-3 gap-2">
      {images.map((url, i) => (
        <button
          key={i}
          onClick={() => setOpenIndex(i)}
          className="relative aspect-square rounded-lg overflow-hidden"
        >
          <img src={url} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white text-xl"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white text-2xl"
            >
              ‹
            </button>
          )}

          <img
            src={images[openIndex]}
            alt={`${name} ${openIndex + 1}`}
            className="max-w-[92vw] max-h-[85vh] object-contain touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).dataset.startX = String(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              const startX = Number((e.currentTarget as HTMLElement).dataset.startX || 0);
              const endX = e.changedTouches[0].clientX;
              const diff = startX - endX;
              if (Math.abs(diff) > 50) {
                diff > 0 ? next() : prev();
              }
            }}
          />

          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/10 text-white text-2xl"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-4 text-white/70 text-xs tabular-nums">
            {openIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
