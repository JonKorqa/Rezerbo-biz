import { addDoc, collection, getDocs, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Appointment } from '../types/appointment';

const collectionName = 'appointments';

export interface NewAppointmentInput {
  businessId: string;
  clientId: string | null;
  clientName: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  color?: string;
}

export async function createAppointment(input: NewAppointmentInput): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    businessId: input.businessId,
    type: 'booking',
    clientId: input.clientId,
    clientName: input.clientName,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    staffId: input.staffId,
    startTime: Timestamp.fromDate(input.startTime),
    endTime: Timestamp.fromDate(input.endTime),
    color: input.color ?? null,
    status: 'confirmed',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export interface NewReservationInput {
  businessId: string;
  label: string;
  startTime: Date;
  endTime: Date;
}

// Blocks a calendar slot without a client or service attached — same collection as
// bookings (so it's covered by the existing `appointments` Firestore rule), distinguished
// by `type: 'reservation'`. Rendering code must branch on `type` to hide client/service info.
export async function createReservation(input: NewReservationInput): Promise<void> {
  await addDoc(collection(db, collectionName), {
    businessId: input.businessId,
    type: 'reservation',
    clientId: null,
    clientName: '',
    serviceName: '',
    label: input.label,
    staffId: input.businessId,
    startTime: Timestamp.fromDate(input.startTime),
    endTime: Timestamp.fromDate(input.endTime),
    color: null,
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
      type: data.type === 'reservation' ? 'reservation' : 'booking',
      clientId: data.clientId ?? null,
      clientName: data.clientName ?? 'Client',
      serviceName: data.serviceName ?? 'Appointment',
      label: data.label ?? undefined,
      startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
      endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
      color: data.color,
    } satisfies Appointment;
  });
}
