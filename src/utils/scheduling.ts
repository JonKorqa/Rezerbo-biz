export const BUSINESS_OPEN_HOUR = 10;
export const BUSINESS_CLOSE_HOUR = 19;

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getDefaultStartTime(): Date {
  const now = new Date();
  const minutes = now.getMinutes();
  const remainder = minutes % 15;
  const rounded = new Date(now);
  if (remainder !== 0 || now.getSeconds() > 0) {
    rounded.setMinutes(minutes - remainder + 15, 0, 0);
  } else {
    rounded.setSeconds(0, 0);
  }
  if (rounded.getHours() < BUSINESS_OPEN_HOUR) {
    rounded.setHours(BUSINESS_OPEN_HOUR, 0, 0, 0);
  } else if (rounded.getHours() >= BUSINESS_CLOSE_HOUR) {
    rounded.setHours(BUSINESS_CLOSE_HOUR - 1, 0, 0, 0);
  }
  return rounded;
}

export function formatDateTime(date: Date, locale: string, todayLabel: string) {
  const dayLabel = isSameDay(date, new Date())
    ? todayLabel
    : date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  return `${dayLabel}, ${timeLabel}`;
}

export function formatDayChip(date: Date, locale: string, todayLabel: string, tomorrowLabel: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, today)) return todayLabel;
  if (isSameDay(date, tomorrow)) return tomorrowLabel;
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
}

export function buildDayOptions(daysAhead = 14): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export function buildTimeSlots(): { hour: number; minute: number }[] {
  const slots: { hour: number; minute: number }[] = [];
  for (let h = BUSINESS_OPEN_HOUR; h < BUSINESS_CLOSE_HOUR; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push({ hour: h, minute: m });
    }
  }
  return slots;
}

// Local (not UTC) YYYY-MM-DD key — used to compare/store dates without time-of-day or timezone drift.
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
