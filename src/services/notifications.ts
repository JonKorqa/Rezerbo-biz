import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { AppNotification, NotificationType } from '../types/notification';
import type { Appointment } from '../types/appointment';

const REMINDER_WINDOW_MS = 60 * 60 * 1000;

export interface NewNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string | null;
}

export async function createNotification(businessId: string, input: NewNotificationInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'notifications'), {
    businessId,
    type: input.type,
    title: input.title,
    message: input.message,
    appointmentId: input.appointmentId ?? null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getBusinessNotifications(businessId: string): Promise<AppNotification[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'notifications'));
  const notifications = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      businessId: data.businessId,
      type: data.type === 'upcoming_reminder' ? 'upcoming_reminder' : 'new_booking',
      title: data.title ?? '',
      message: data.message ?? '',
      read: data.read ?? false,
      appointmentId: data.appointmentId ?? null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt ?? Date.now()),
    } satisfies AppNotification;
  });
  return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationRead(businessId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'notifications', notificationId), { read: true });
}

async function hasReminderForAppointment(businessId: string, appointmentId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'businesses', businessId, 'notifications'),
      where('type', '==', 'upcoming_reminder'),
      where('appointmentId', '==', appointmentId),
    ),
  );
  return !snap.empty;
}

function formatReminderMessage(appointment: Appointment): string {
  const clientLabel = appointment.type === 'reservation' ? appointment.label || 'Reservation' : appointment.clientName || 'Walk-in';
  const timeLabel = appointment.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${clientLabel} - ${appointment.serviceLabel} at ${timeLabel}`;
}

// Creates an "upcoming" reminder for any appointment starting within the next hour that
// doesn't already have one — checked one appointment at a time (small per-business counts)
// to avoid a race where two reminders get created for the same appointment.
export async function createUpcomingReminders(businessId: string, appointments: Appointment[]): Promise<void> {
  const now = Date.now();
  const upcoming = appointments.filter((appt) => {
    const diff = appt.start.getTime() - now;
    return diff > 0 && diff <= REMINDER_WINDOW_MS;
  });

  for (const appt of upcoming) {
    const alreadyExists = await hasReminderForAppointment(businessId, appt.id);
    if (alreadyExists) continue;
    await createNotification(businessId, {
      type: 'upcoming_reminder',
      title: 'Upcoming Appointment',
      message: formatReminderMessage(appt),
      appointmentId: appt.id,
    });
  }
}
