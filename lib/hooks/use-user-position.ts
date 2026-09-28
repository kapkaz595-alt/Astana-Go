'use client';

import { useEffect, useRef, useState } from 'react';

export type UserPos = { lat: number; lng: number };

export function haversine(a: UserPos, b: UserPos) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 只在用户已授权定位时自动获取位置；未授权不弹窗
export function useUserPosition() {
  const [pos, setPos] = useState<UserPos | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastRef = useRef<UserPos | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let status: PermissionStatus | null = null;

    const start = () => {
      if (watchRef.current !== null) return;
      watchRef.current = navigator.geolocation.watchPosition(
        (p) => {
          const next = { lat: p.coords.latitude, lng: p.coords.longitude };
          if (!lastRef.current || haversine(lastRef.current, next) > 500) {
            lastRef.current = next;
            setPos(next);
          }
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
      );
    };

    const stop = () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };

    try {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((r) => {
          status = r;
          if (r.state === 'granted') start();
          r.onchange = () => {
            if (r.state === 'granted') {
              start();
            } else {
              stop();
              lastRef.current = null;
              setPos(null);
            }
          };
        })
        .catch(() => {});
    } catch {}

    return () => {
      stop();
      if (status) status.onchange = null;
    };
  }, []);

  return pos;
}
