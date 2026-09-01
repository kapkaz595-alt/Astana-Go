'use client';
import { useState, useEffect } from 'react';

type Banner = { id: string; image_url: string; link_url: string | null };

export function BannerSlot({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  const handleClick = (b: Banner) => {
    if (b.link_url) {
      window.location.href = b.link_url;
    } else {
      setLightboxImage(b.image_url);
    }
  };

  return (
    <>
      <div className="relative w-full h-[140px] md:h-[160px] rounded-xl overflow-hidden">
        {banners.map((b, i) => (
          <img
            key={b.id}
            src={b.image_url}
            onClick={() => handleClick(b)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 cursor-pointer ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
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

      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
