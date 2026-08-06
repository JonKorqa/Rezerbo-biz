export type AppointmentType = 'booking' | 'reservation';

export interface Appointment {
  id: string;
  businessId: string;
  type: AppointmentType;
  clientId: string | null;
  clientName: string;
  serviceName: string;
  label?: string;
  startTime: Date;
  endTime: Date;
  color?: string;
}
