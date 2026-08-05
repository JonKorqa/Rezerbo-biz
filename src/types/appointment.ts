export type AppointmentType = 'booking' | 'reservation';

export interface Appointment {
  id: string;
  businessId: string;
  type: AppointmentType;
  clientId: string | null;
  clientName: string;
  serviceLabel: string;
  label?: string;
  start: Date;
  end: Date;
  color?: string;
}
