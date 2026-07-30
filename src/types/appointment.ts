export interface Appointment {
  id: string;
  businessId: string;
  clientName: string;
  serviceLabel: string;
  start: Date;
  end: Date;
  color?: string;
}
