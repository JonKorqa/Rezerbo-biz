export interface Appointment {
  id: string;
  businessId: string;
  clientId: string | null;
  clientName: string;
  serviceLabel: string;
  start: Date;
  end: Date;
  color?: string;
}
