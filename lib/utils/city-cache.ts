import { SupabaseClient } from '@supabase/supabase-js';

type CityCache = { id: string; slug: string; cachedAt: number };

// 进程内存缓存，5分钟过期
const cache = new Map<string, CityCache>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getCityId(
  supabase: SupabaseClient,
  citySlug: string
): Promise<string | null> {
  const cached = cache.get(citySlug);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.id;
  }

  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();

  if (!city) return null;

  cache.set(citySlug, { id: city.id, slug: citySlug, cachedAt: Date.now() });
  return city.id;
}
