'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildAdvice,
  type AdviceLang,
  type WeatherInput,
} from '../../lib/utils/weather-advice'

interface ForecastItem {
  time: number
  temp: number
  feels_like: number
  wind_speed: number
  pop: number
  condition_id: number | null
  icon: string | null
}

interface WeatherData extends WeatherInput {
  temp: number
  humidity: number
  icon: string | null
  aqi: number | null
  forecast: ForecastItem[]
}

const T = {
  zh: {
    feels: '体感',
    wind: '风力',
    humidity: '湿度',
    air: '空气质量',
    next: '未来几小时',
    aqi: ['良好', '较好', '一般', '较差', '很差'],
  },
  kk: {
    feels: 'Сезілуі',
    wind: 'Жел',
    humidity: 'Ылғалдылық',
    air: 'Ауа сапасы',
    next: 'Алдағы сағаттар',
    aqi: ['Жақсы', 'Қанағаттанарлық', 'Орташа', 'Нашар', 'Өте нашар'],
  },
}

function iconEmoji(icon: string | null): string {
  if (!icon) return '🌡️'
  const night = icon.endsWith('n')
  switch (icon.slice(0, 2)) {
    case '01':
      return night ? '🌙' : '☀️'
    case '02':
      return night ? '☁️' : '⛅'
    case '03':
    case '04':
      return '☁️'
    case '09':
      return '🌧️'
    case '10':
      return '🌦️'
    case '11':
      return '⛈️'
    case '13':
      return '❄️'
    case '50':
      return '🌫️'
    default:
      return '🌡️'
  }
}

function hourLabel(ts: number): string {
  const h = new Date((ts + 5 * 3600) * 1000).getUTCHours()
  return `${String(h).padStart(2, '0')}:00`
}

export default function WeatherChip({
  lang = 'zh',
  city = 'astana',
}: {
  lang?: AdviceLang
  city?: string
}) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/v1/weather?city=${encodeURIComponent(city)}`)
      .then((r) => {
        if (!r.ok) throw new Error('bad response')
        return r.json()
      })
      .then((d: WeatherData) => {
        if (!cancelled) {
          setData(d)
          setState('ok')
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [city])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const advice = useMemo(
    () => (data ? buildAdvice(data, lang) : null),
    [data, lang]
  )

  if (state === 'error') return null

  if (state === 'loading' || !data || !advice) {
    return (
      <div
        className="h-9 w-full animate-pulse rounded-xl bg-gray-200"
        aria-hidden
      />
    )
  }

  const t = T[lang]
  const aqiText = data.aqi ? t.aqi[data.aqi - 1] ?? '—' : '—'
  const summary = [advice.warnings[0], advice.clothing]
    .filter(Boolean)
    .join(' · ')
  const tone =
    advice.severity === 'danger'
      ? 'border-red-300 bg-red-50 text-red-700'
      : advice.severity === 'warn'
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-gray-200 bg-white text-gray-800'
  const tagTone =
    advice.severity === 'danger'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-800'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-xs ${tone}`}
      >
        <span className="text-base" aria-hidden>
          {iconEmoji(data.icon)}
        </span>
        <span className="font-semibold">{data.temp}°</span>
        <span className="shrink-0 opacity-70">{advice.windLabel}</span>
        <span className="opacity-40">|</span>
        <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
        <span className="shrink-0 opacity-50" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 md:bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            className="fixed left-4 right-4 top-20 z-[70] mx-auto max-w-sm rounded-2xl border border-gray-200 bg-white p-4 text-gray-800 shadow-xl md:absolute md:left-0 md:right-auto md:top-full md:mx-0 md:mt-2 md:w-80"
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden>
                {iconEmoji(data.icon)}
              </span>
              <div>
                <div className="text-2xl font-semibold">{data.temp}°C</div>
                <div className="text-xs text-gray-500">
                  {t.feels} {data.feels_like}°C · {advice.windLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close"
                className="ml-auto p-1 text-gray-400"
              >
                ✕
              </button>
            </div>

            {advice.warnings.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {advice.warnings.map((w) => (
                  <span
                    key={w}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${tagTone}`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-3 text-sm">👕 {advice.clothing}</p>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">{t.wind}</dt>
                <dd className="mt-0.5 font-medium">
                  {data.wind_speed.toFixed(1)} m/s
                </dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">{t.humidity}</dt>
                <dd className="mt-0.5 font-medium">{data.humidity}%</dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-2">
                <dt className="text-gray-500">{t.air}</dt>
                <dd className="mt-0.5 font-medium">{aqiText}</dd>
                {data.pm2_5 !== null && (
                  <dd className="text-[10px] text-gray-400">
                    PM2.5 {Math.round(data.pm2_5)}
                  </dd>
                )}
              </div>
            </dl>

            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-2 text-xs text-gray-500">{t.next}</div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {data.forecast.slice(0, 4).map((f) => (
                  <div key={f.time}>
                    <div className="text-gray-500">{hourLabel(f.time)}</div>
                    <div className="my-0.5 text-lg" aria-hidden>
                      {iconEmoji(f.icon)}
                    </div>
                    <div className="font-medium">{f.temp}°</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-right text-[10px] text-gray-400">
              <a
                href="https://openweathermap.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Weather data by OpenWeatherMap
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
