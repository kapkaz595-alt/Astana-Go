'use client';

import { useRef } from 'react';

export default function GallerySlider({ images, name }: { images: string[]; name: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${name} ${i + 1}`}
            className="w-full aspect-[4/3] object-cover rounded-xl shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          />
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 transition"
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white/90 shadow opacity-0 group-hover:opacity-100 transition"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
