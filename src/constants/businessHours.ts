import type { BusinessHours, DateHoursOverrides, DayHours, DayOfWeek, TimeOffEntry } from '../types/business';
import { toDateKey } from '../utils/scheduling';

export const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Index-aligned with Date#getDay() (0 = Sunday).
export const JS_DAY_ORDER: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DEFAULT_DAY_HOURS: DayHours = { closed: false, start: '09:00', end: '18:00' };

export const DEFAULT_BUSINESS_HOURS: BusinessHours = DAY_ORDER.reduce((acc, day) => {
  acc[day] = { ...DEFAULT_DAY_HOURS };
  return acc;
}, {} as BusinessHours);

export function dayOfWeekFor(date: Date): DayOfWeek {
  return JS_DAY_ORDER[date.getDay()];
}

// Single-day time-off entries have startDate === endDate; ranges are inclusive on both ends.
export function findTimeOffForDate(date: Date, timeOff: TimeOffEntry[] = []): TimeOffEntry | undefined {
  const key = toDateKey(date);
  return timeOff.find((entry) => key >= entry.startDate && key <= entry.endDate);
}

// A per-date override (set via Opening Calendar) takes precedence over the weekly default.
export function effectiveDayHours(
  date: Date,
  hours: BusinessHours,
  overrides: DateHoursOverrides = {},
): DayHours {
  return overrides[toDateKey(date)] ?? hours[dayOfWeekFor(date)];
}
