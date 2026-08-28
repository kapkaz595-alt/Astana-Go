type Translation = { locale: string; [key: string]: unknown };

const FALLBACK_ORDER = ['zh', 'kk', 'ru'];

/**
 * 按zh→kk→ru的顺序，从多语言翻译数组里选出请求的locale对应的一条；
 * 若请求的locale不存在，按fallback顺序依次尝试，最终兜底为数组第一条
 */
export function pickTranslation<T extends Translation>(
  translations: T[],
  requestedLocale: string
): T | null {
  if (!translations || translations.length === 0) return null;

  // 1. 精确匹配请求的语言
  const exact = translations.find((t) => t.locale === requestedLocale);
  if (exact) return exact;

  // 2. 按统一fallback顺序尝试（跳过已经试过的requestedLocale）
  for (const locale of FALLBACK_ORDER) {
    if (locale === requestedLocale) continue;
    const found = translations.find((t) => t.locale === locale);
    if (found) return found;
  }

  // 3. 兜底：返回数组第一条（防止极端情况下fallback顺序里的语言都没有，但存在其他语言）
  return translations[0];
}

/**
 * 从扁平多语言对象(如 merchants.name: {zh,kk,ru})中按locale取值
 * 用于merchants表这种jsonb字段结构(非content_translations数组结构)
 */
export function pickLocaleField(
  field: Record<string, string> | null | undefined,
  requestedLocale: string
): string {
  if (!field) return '';
  if (field[requestedLocale]) return field[requestedLocale];
  for (const locale of FALLBACK_ORDER) {
    if (locale === requestedLocale) continue;
    if (field[locale]) return field[locale];
  }
  const values = Object.values(field);
  return values.length > 0 ? String(values[0]) : '';
}