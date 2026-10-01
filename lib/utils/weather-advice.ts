export type AdviceLang = 'zh' | 'kk'

export interface WeatherInput {
  feels_like: number
  wind_speed: number
  wind_gust: number | null
  condition_id: number | null
  pm2_5: number | null
  forecast?: { pop: number; condition_id: number | null }[]
}

export interface WeatherAdvice {
  clothing: string
  warnings: string[]
  severity: 'normal' | 'warn' | 'danger'
  beaufort: number
  windLabel: string
}

type ClothingKey =
  | 'extreme'
  | 'severe'
  | 'veryCold'
  | 'cold'
  | 'cool'
  | 'mild'
  | 'hot'

type WarningKey =
  | 'extremeCold'
  | 'gale'
  | 'windy'
  | 'airBad'
  | 'rain'
  | 'snow'
  | 'thunder'

const CLOTHING: Record<ClothingKey, Record<AdviceLang, string>> = {
  extreme: {
    zh: '极寒！尽量少出门，出门请穿最厚的羽绒服，戴帽子、围巾、手套',
    kk: 'Өте қатты аяз! Мүмкіндігінше үйден шықпаңыз, ең қалың күртке, бөрік, шарф және қолғап киіңіз',
  },
  severe: {
    zh: '严寒，穿厚羽绒服，戴帽子、围巾、手套',
    kk: 'Қатты аяз, қалың күртке киіп, бөрік, шарф және қолғап тағыңыз',
  },
  veryCold: {
    zh: '很冷，穿羽绒服或厚外套，戴围巾',
    kk: 'Өте суық, күртке немесе қалың пальто киіп, шарф тағыңыз',
  },
  cold: {
    zh: '偏冷，穿厚外套加毛衣',
    kk: 'Суық, қалың пальто мен свитер киіңіз',
  },
  cool: {
    zh: '微凉，穿外套或夹克',
    kk: 'Салқын, күртке немесе жеңіл пальто киіңіз',
  },
  mild: {
    zh: '比较舒适，穿长袖或薄外套',
    kk: 'Жайлы ауа райы, ұзын жеңді киім немесе жұқа күртке киіңіз',
  },
  hot: {
    zh: '炎热，穿短袖，注意防晒和补水',
    kk: 'Ыстық, қысқа жеңді киім киіп, күннен қорғанып, су ішіңіз',
  },
}

const WARNINGS: Record<WarningKey, Record<AdviceLang, string>> = {
  extremeCold: { zh: '极寒预警', kk: 'Қатты аяз ескертуі' },
  gale: { zh: '大风预警', kk: 'Қатты жел ескертуі' },
  windy: { zh: '风大，注意防风', kk: 'Жел қатты, желден сақтаныңыз' },
  airBad: {
    zh: '空气质量较差，建议戴口罩',
    kk: 'Ауа сапасы нашар, бетперде тағыңыз',
  },
  rain: { zh: '有雨，记得带伞', kk: 'Жаңбыр жауады, қолшатыр алыңыз' },
  snow: {
    zh: '有雪，路面湿滑，注意防滑',
    kk: 'Қар жауады, жол тайғақ, абайлаңыз',
  },
  thunder: {
    zh: '有雷暴，尽量少外出',
    kk: 'Найзағай болады, мүмкіндігінше сыртқа шықпаңыз',
  },
}

const BEAUFORT_LIMITS = [
  0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7,
]

export function toBeaufort(speed: number): number {
  const i = BEAUFORT_LIMITS.findIndex((limit) => speed < limit)
  return i === -1 ? 12 : i
}

function windLabel(level: number, lang: AdviceLang): string {
  return lang === 'kk' ? `жел ${level} балл` : `风${level}级`
}

function clothingKey(feelsLike: number): ClothingKey {
  if (feelsLike <= -25) return 'extreme'
  if (feelsLike <= -15) return 'severe'
  if (feelsLike <= -5) return 'veryCold'
  if (feelsLike <= 5) return 'cold'
  if (feelsLike <= 15) return 'cool'
  if (feelsLike < 25) return 'mild'
  return 'hot'
}

function precipKind(id: number | null): 'thunder' | 'snow' | 'rain' | null {
  if (id === null) return null
  if (id >= 200 && id < 300) return 'thunder'
  if (id >= 600 && id < 700) return 'snow'
  if ((id >= 300 && id < 400) || (id >= 500 && id < 600)) return 'rain'
  return null
}

export function buildAdvice(
  w: WeatherInput,
  lang: AdviceLang = 'zh'
): WeatherAdvice {
  const level = toBeaufort(Math.max(w.wind_speed, w.wind_gust ?? 0))
  const keys: WarningKey[] = []

  if (w.feels_like <= -25) keys.push('extremeCold')
  if (level >= 7) keys.push('gale')
  else if (level >= 5) keys.push('windy')
  if (w.pm2_5 !== null && w.pm2_5 > 35) keys.push('airBad')

  const kinds = [precipKind(w.condition_id)]
  for (const f of (w.forecast ?? []).slice(0, 3)) {
    if (f.pop >= 0.5) kinds.push(precipKind(f.condition_id))
  }
  if (kinds.includes('thunder')) keys.push('thunder')
  else if (kinds.includes('snow')) keys.push('snow')
  else if (kinds.includes('rain')) keys.push('rain')

  const severity =
    keys.includes('extremeCold') ||
    keys.includes('gale') ||
    keys.includes('thunder')
      ? 'danger'
      : keys.length > 0
        ? 'warn'
        : 'normal'

  return {
    clothing: CLOTHING[clothingKey(w.feels_like)][lang],
    warnings: keys.map((k) => WARNINGS[k][lang]),
    severity,
    beaufort: level,
    windLabel: windLabel(level, lang),
  }
}
