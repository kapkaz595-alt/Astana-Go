'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type NearbyMerchant = {
  id: string;
  slug: string;
  name: string;
  cover_image: string | null;
  is_open_now: boolean;
  distance_m: number;
  price_range: string | null;
};

type Pos = { lat: number; lng: number };

const TEXT = {
  zh: {
    title: '附近商家',
    idleTitle: '看看你附近有什么',
    idleDesc: '开启定位，自动显示 3 公里内的商家',
    idleBtn: '📍 查看附近商家',
    locating: '正在获取位置…',
    denied: '没有定位权限，请在浏览器设置里允许本站使用位置信息',
    error: '获取位置失败，请稍后重试',
    empty: '附近 3 公里内暂无商家',
    refresh: '刷新',
    retry: '重试',
    open: '营业中',
    closed: '已打烊',
    m: '米',
    km: '公里',
  },
  kk: {
    title: 'Жақын маңдағы дүкендер',
    idleTitle: 'Жақын маңда не бар екенін көріңіз',
    idleBtn: '📍 Жақын маңдағы дүкендер',
    idleDesc: '3 км ішіндегі дүкендер автоматты түрде көрсетіледі',
    locating: 'Орналасқан жер анықталуда…',
    denied: 'Геолокацияға рұқсат жоқ. Браузер параметрлерінде рұқсат беріңіз',
    error: 'Орынды анықтау мүмкін болмады',
    empty: '3 км ішінде дүкен жоқ',
    refresh: 'Жаңарту',
    retry: 'Қайталау',
    open: 'Ашық',
    closed: 'Жабық',
    m: 'м',
    km: 'км',
  },
};

function distanceBetween(a: Pos, b: Pos) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function NearbySection({
  locale,
  citySlug,
}: {
  locale: 'zh' | 'kk';
  citySlug: string;
}) {
  const t = TEXT[locale];
  const [status, setStatus] = useState<'idle' | 'locating' | 'ready' | 'denied' | 'error'>('idle');
  const [list, setList] = useState<NearbyMerchant[]>([]);
  const [loading, setLoading] = useState(false);
  const lastPosRef = useRef<Pos | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const load = useCallback(
    async (p: Pos) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/merchants/nearby?lat=${p.lat}&lng=${p.lng}&radius=3000&limit=20&locale=${locale}&city_slug=${citySlug}`
        );
        const json = await res.json();
        if (json.success) {
          setList(json.data ?? []);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      } finally {
        setLoading(false);
      }
    },
    [locale, citySlug]
  );

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('locating');
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // 首次定位，或移动超过 500 米才重新请求
        if (!lastPosRef.current || distanceBetween(lastPosRef.current, p) > 500) {
          lastPosRef.current = p;
          load(p);
        }
      },
      (err) => setStatus(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
    );
  }, [load]);

  // 之前已授权过定位的，打开页面自动开始
  useEffect(() => {
    try {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((r) => {
          if (r.state === 'granted') start();
        })
        .catch(() => {});
    } catch {}
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换语言或城市时，用上次位置重新加载
  useEffect(() => {
    if (lastPosRef.current) load(lastPosRef.current);
  }, [locale, citySlug, load]);

  function refresh() {
    if (lastPosRef.current) load(lastPosRef.current);
    else start();
  }

  function formatDistance(m: number) {
    return m < 1000 ? `${m} ${t.m}` : `${(m / 1000).toFixed(1)} ${t.km}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-[18px] pt-[20px] pb-3">
        <div className="font-extrabold text-[16px]" style={{ fontFamily: 'Manrope' }}>
          📍 {t.title}
        </div>
        {status === 'ready' && (
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs text-[#6B7280] font-medium py-2 px-1 -mr-1 disabled:opacity-50"
          >
            {loading ? '…' : `↻ ${t.refresh}`}
          </button>
        )}
      </div>

      {status === 'idle' && (
        <div className="mx-[18px] rounded-2xl bg-white border border-[#E7E9EE] p-4 shadow-sm">
          <p className="text-[13px] font-bold text-[#14171F]">{t.idleTitle}</p>
          <p className="text-[11px] text-[#6B7280] mt-1">{t.idleDesc}</p>
          <button
            onClick={start}
            className="mt-3 text-[12px] font-bold text-white bg-[#2B8C93] rounded-full px-4 py-2"
          >
            {t.idleBtn}
          </button>
        </div>
      )}

      {status === 'locating' && (
        <div className="mx-[18px] text-[12px] text-[#6B7280]">{t.locating}</div>
      )}

      {(status === 'denied' || status === 'error') && (
        <div className="mx-[18px] rounded-2xl bg-white border border-[#E7E9EE] p-4">
          <p className="text-[12px] text-[#6B7280]">{status === 'denied' ? t.denied : t.error}</p>
          <button
            onClick={start}
            className="mt-2 text-[12px] font-bold text-[#2B8C93]"
          >
            {t.retry}
          </button>
        </div>
      )}

      {status === 'ready' && list.length === 0 && !loading && (
        <div className="mx-[18px] text-[12px] text-[#6B7280]">{t.empty}</div>
      )}

      {status === 'ready' && list.length > 0 && (
        <div
          className="flex md:grid md:grid-cols-6 gap-[11px] overflow-x-auto md:overflow-visible px-[18px] pb-1 no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {list.map((m) => (
            <Link
              key={m.id}
              href={`/merchants/${m.slug}`}
              className="shrink-0 md:shrink md:w-auto w-[148px] bg-white rounded-[14px] overflow-hidden border"
            >
              <div className="relative w-full h-[104px] flex items-end p-2 overflow-hidden bg-[#EDEFF3]">
                {m.cover_image && (
                  <Image src={m.cover_image} alt={m.name} fill sizes="148px" className="object-cover" />
                )}
                <span
                  className={`relative text-[9.5px] font-bold px-2 py-[3px] rounded-full flex items-center gap-1 bg-white/95 ${
                    m.is_open_now ? 'text-[#1D7A44]' : 'text-[#B54B3A]'
                  }`}
                >
                  <span
                    className={`w-[6px] h-[6px] rounded-full ${
                      m.is_open_now ? 'bg-[#2E9E5B]' : 'bg-[#B54B3A]'
                    }`}
                  />
                  {m.is_open_now ? t.open : t.closed}
                </span>
              </div>
              <div className="px-[10px] pt-[9px] pb-[10px]">
                <div className="text-[13px] font-bold">{m.name}</div>
                <div className="text-[10px] text-[#2B8C93] font-medium mt-1">
                  📍 {formatDistance(m.distance_m)}
                </div>
                {m.price_range && (
                  <div className="text-[10px] text-[#D9A441] font-medium mt-1">{m.price_range}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
