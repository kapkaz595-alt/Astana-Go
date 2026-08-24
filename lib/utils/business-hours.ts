type TimeSlot = { open: string; close: string };
type BusinessHours = Partial<Record<
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
  TimeSlot[]
>>;

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 判断商家当前是否营业中（基于阿斯塔纳时区 Asia/Almaty，固定UTC+5）
 */
export function isOpenNow(businessHours: BusinessHours | null | undefined): boolean {
  if (!businessHours || Object.keys(businessHours).length === 0) return false;

  // 获取阿斯塔纳当前时间（UTC+5，无夏令时）
  const now = new Date();
  const almatyMs = now.getTime() + 5 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000;
  const almatyDate = new Date(almatyMs);

  const dayIndex = almatyDate.getUTCDay(); // 0=周日
  const currentMinutes = almatyDate.getUTCHours() * 60 + almatyDate.getUTCMinutes();

  const todayName = DAY_NAMES[dayIndex];
  const yesterdayName = DAY_NAMES[(dayIndex + 6) % 7];

  // 检查今天的时间段
  const todaySlots = businessHours[todayName] || [];
  for (const slot of todaySlots) {
    const open = timeToMinutes(slot.open);
    const close = timeToMinutes(slot.close);
    if (close > open) {
      // 正常时段（不跨夜）
      if (currentMinutes >= open && currentMinutes < close) return true;
    } else {
      // 跨夜时段（如 22:00-02:00），今天开始的部分
      if (currentMinutes >= open) return true;
    }
  }

  // 检查昨天的跨夜时段是否延续到今天凌晨
  const yesterdaySlots = businessHours[yesterdayName] || [];
  for (const slot of yesterdaySlots) {
    const open = timeToMinutes(slot.open);
    const close = timeToMinutes(slot.close);
    if (close <= open) {
      // 跨夜时段延续到今天的部分
      if (currentMinutes < close) return true;
    }
  }

  return false;
}