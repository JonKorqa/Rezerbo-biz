import { addDoc, collection, getDocs, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Appointment } from '../types/appointment';

const collectionName = 'appointments';

export interface NewAppointmentInput {
  businessId: string;
  clientId: string | null;
  clientName: string;
  serviceId: string;
  serviceLabel: string;
  staffId: string;
  start: Date;
  end: Date;
  color?: string;
}

export async function createAppointment(input: NewAppointmentInput): Promise<void> {
  await addDoc(collection(db, collectionName), {
    businessId: input.businessId,
    clientId: input.clientId,
    clientName: input.clientName,
    serviceId: input.serviceId,
    serviceLabel: input.serviceLabel,
    staffId: input.staffId,
    start: Timestamp.fromDate(input.start),
    end: Timestamp.fromDate(input.end),
    color: input.color ?? null,
    status: 'confirmed',
    createdAt: serverTimestamp(),
  });
}

// NOTE: filters by businessId only (no date range) to avoid requiring a composite
// Firestore index — the small per-business appointment count makes client-side
// filtering by day cheap enough for now.
export async function getBusinessAppointments(businessId: string): Promise<Appointment[]> {
  const snap = await getDocs(query(collection(db, collectionName), where('businessId', '==', businessId)));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      businessId: data.businessId,
      clientId: data.clientId ?? null,
      clientName: data.clientName ?? 'Client',
      serviceLabel: data.serviceLabel ?? 'Appointment',
      start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
      end: data.end?.toDate ? data.end.toDate() : new Date(data.end),
      color: data.color,
    } satisfies Appointment;
  });
}
