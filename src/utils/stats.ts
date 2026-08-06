import type { Transaction } from '../types/transaction';
import type { Appointment } from '../types/appointment';
import type { Client } from '../types/client';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffFromMonday);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export interface PeriodStat {
  total: number;
  count: number;
}

export interface RevenueSummary {
  today: PeriodStat;
  week: PeriodStat;
  month: PeriodStat;
}

export function computeRevenueSummary(transactions: Transaction[], now: Date = new Date()): RevenueSummary {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const today: PeriodStat = { total: 0, count: 0 };
  const week: PeriodStat = { total: 0, count: 0 };
  const month: PeriodStat = { total: 0, count: 0 };
  for (const t of transactions) {
    if (t.createdAt >= monthStart) {
      month.total += t.amount;
      month.count += 1;
    }
    if (t.createdAt >= weekStart) {
      week.total += t.amount;
      week.count += 1;
    }
    if (t.createdAt >= todayStart) {
      today.total += t.amount;
      today.count += 1;
    }
  }
  return { today, week, month };
}

export interface DayRevenue {
  label: string;
  date: Date;
  total: number;
}

// Oldest-to-newest, 7 entries including today.
export function computeLast7DaysRevenue(
  transactions: Transaction[],
  now: Date = new Date(),
  locale = 'en-US',
): DayRevenue[] {
  const days: DayRevenue[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = startOfDay(new Date(now));
    date.setDate(date.getDate() - i);
    days.push({ label: date.toLocaleDateString(locale, { weekday: 'short' }), date, total: 0 });
  }
  for (const t of transactions) {
    const day = startOfDay(t.createdAt).getTime();
    const match = days.find((d) => d.date.getTime() === day);
    if (match) match.total += t.amount;
  }
  return days;
}

export interface ServiceCount {
  label: string;
  count: number;
}

// Ranks services by how many booking-type appointments reference them. Reservations
// (calendar blocks with no client/service) are excluded — they aren't client bookings.
export function computeTopServices(appointments: Appointment[], limit = 5): ServiceCount[] {
  const counts = new Map<string, number>();
  for (const a of appointments) {
    if (a.type !== 'booking' || !a.serviceName) continue;
    counts.set(a.serviceName, (counts.get(a.serviceName) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface ClientStats {
  total: number;
  newThisMonth: number;
}

export function computeClientStats(clients: Client[], now: Date = new Date()): ClientStats {
  const monthStart = startOfMonth(now);
  const newThisMonth = clients.filter((c) => c.createdAt && c.createdAt >= monthStart).length;
  return { total: clients.length, newThisMonth };
}

export interface AppointmentStats {
  totalThisMonth: number;
  completed: number;
  upcoming: number;
}

// Only counts client bookings (not manual reservations). "Completed" vs "upcoming" is
// derived from the appointment's end time vs now — there's no separate status field
// tracking cancellations/no-shows yet.
export function computeAppointmentStats(appointments: Appointment[], now: Date = new Date()): AppointmentStats {
  const monthStart = startOfMonth(now);
  const bookings = appointments.filter((a) => a.type === 'booking');
  const thisMonth = bookings.filter((a) => a.startTime >= monthStart);
  const completed = thisMonth.filter((a) => a.endTime <= now).length;
  const upcoming = thisMonth.length - completed;
  return { totalThisMonth: thisMonth.length, completed, upcoming };
}
