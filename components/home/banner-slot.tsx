'use client';
import { useState, useEffect } from 'react';

type Banner = { id: string; image_url: string; link_url: string | null };

export function BannerSlot({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative w-full h-[140px] md:h-[160px] rounded-xl overflow-hidden">
      {banners.map((b, i) => (
        <a
          key={b.id}
          href={b.link_url || '#'}
          className={`absolute inset-0 transition-opacity duration-500 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img src={b.image_url} className="w-full h-full object-cover" />
        </a>
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}