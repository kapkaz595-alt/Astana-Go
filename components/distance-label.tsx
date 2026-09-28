'use client';

import { useUserPosition, haversine } from '@/lib/hooks/use-user-position';

export default function DistanceLabel({
  lat,
  lng,
  note,
  locale,
}: {
  lat: number | null;
  lng: number | null;
  note: string | null;
  locale: 'zh' | 'kk';
}) {
  const pos = useUserPosition();

  if (pos && lat != null && lng != null) {
    const r = Math.round(haversine(pos, { lat, lng }));
    const text =
      locale === 'kk'
        ? r < 1000 ? `${r} м` : `${(r / 1000).toFixed(1)} км`
        : r < 1000 ? `${r} 米` : `${(r / 1000).toFixed(1)} 公里`;
    return (
      <div className="text-[10.5px] text-[#2B8C93] font-medium mt-1">
        📍{locale === 'kk' ? 'Сізден ' : '距你 '}
        {text}
      </div>
    );
  }

  if (note) {
    return <div className="text-[10.5px] text-[#6B7280] mt-1">📍{note}</div>;
  }
  return null;
}
