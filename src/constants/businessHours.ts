import type { BusinessHours, DayHours, DayOfWeek } from '../types/business';

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
