import { NextResponse } from 'next/server'

const CITIES: Record<string, { lat: number; lon: number }> = {
  astana: { lat: 51.1694, lon: 71.4491 },
}

const BASE = 'https://api.openweathermap.org/data/2.5'

interface FcItem {
  dt: number
  pop?: number
  main: { temp: number; feels_like: number }
  wind?: { speed: number }
  weather?: { id: number; icon: string }[]
}

async function getJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 600 } })
  if (!res.ok) throw new Error(`OWM ${res.status}`)
  return res.json()
}

export async function GET(request: Request) {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'weather key missing' }, { status: 500 })
  }

  const slug = new URL(request.url).searchParams.get('city') || 'astana'
  const { lat, lon } = CITIES[slug] ?? CITIES.astana
  const q = `lat=${lat}&lon=${lon}&appid=${key}`

  try {
    const [cur, air, fc] = await Promise.all([
      getJson(`${BASE}/weather?${q}&units=metric`),
      getJson(`${BASE}/air_pollution?${q}`),
      getJson(`${BASE}/forecast?${q}&units=metric&cnt=8`),
    ])

    const w = cur.weather?.[0]
    const a = air.list?.[0]

    return NextResponse.json(
      {
        temp: Math.round(cur.main.temp),
        feels_like: Math.round(cur.main.feels_like),
        humidity: cur.main.humidity,
        wind_speed: cur.wind?.speed ?? 0,
        wind_gust: cur.wind?.gust ?? null,
        condition_id: w?.id ?? null,
        icon: w?.icon ?? null,
        aqi: a?.main?.aqi ?? null,
        pm2_5: a?.components?.pm2_5 ?? null,
        forecast: ((fc.list ?? []) as FcItem[]).map((i) => ({
          time: i.dt,
          temp: Math.round(i.main.temp),
          feels_like: Math.round(i.main.feels_like),
          wind_speed: i.wind?.speed ?? 0,
          pop: i.pop ?? 0,
          condition_id: i.weather?.[0]?.id ?? null,
          icon: i.weather?.[0]?.icon ?? null,
        })),
        updated_at: cur.dt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'weather unavailable' }, { status: 502 })
  }
}
