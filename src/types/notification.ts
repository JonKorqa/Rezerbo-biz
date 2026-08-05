export type NotificationType = 'new_booking' | 'upcoming_reminder';

export interface AppNotification {
  id: string;
  businessId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  appointmentId: string | null;
  createdAt: Date;
}
