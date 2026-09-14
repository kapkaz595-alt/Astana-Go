'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface City {
  id: string;
  slug: string;
  name_zh: string;
  name_kk: string;
  name_ru: string;
  is_active: boolean;
  sort_order: number;
}

export default function CitySelector({
  isOpen,
  onClose,
  currentCitySlug,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentCitySlug: string;
  locale: string;
}) {
  const [cities, setCities] = useState<City[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetch('/api/v1/cities')
        .then((res) => res.json())
        .then((json) => setCities(json.data || []));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cityName = (c: City) => {
    if (locale === 'kk') return c.name_kk;
    if (locale === 'ru') return c.name_ru;
    return c.name_zh;
  };

  const handleSelect = (city: City) => {
    if (!city.is_active) {
      alert('该城市即将开放，敬请期待');
      return;
    }
    document.cookie = `city_slug=${city.slug}; path=/; max-age=31536000`;
    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="flex items-center gap-4 p-4 border-b">
        <button onClick={onClose} className="text-2xl">×</button>
        <div className="flex-1 text-gray-400">选择城市</div>
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-400 mb-2">哈萨克斯坦</div>
        <div className="grid grid-cols-2 gap-3">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelect(city)}
              disabled={city.slug === currentCitySlug}
              className={`text-left py-3 px-4 rounded-lg border ${
                city.is_active
                  ? 'border-gray-200 hover:border-orange-400'
                  : 'border-gray-100 text-gray-300'
              } ${city.slug === currentCitySlug ? 'bg-orange-50 border-orange-400' : ''}`}
            >
              {cityName(city)}
              {!city.is_active && <span className="text-xs ml-1">(即将开放)</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
