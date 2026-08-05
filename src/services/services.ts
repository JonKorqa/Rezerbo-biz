import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Service } from '../types/service';

export async function getBusinessServices(businessId: string): Promise<Service[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'services'));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      businessId,
      name: data.name ?? 'Service',
      durationMinutes: data.durationMinutes ?? 30,
      price: data.price ?? 0,
      category: data.category || undefined,
      color: data.color,
    } satisfies Service;
  });
}

export interface ServiceInput {
  name: string;
  durationMinutes: number;
  price: number;
  category?: string;
}

export async function createService(businessId: string, input: ServiceInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'services'), {
    businessId,
    name: input.name,
    durationMinutes: input.durationMinutes,
    price: input.price,
    category: input.category ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function updateService(businessId: string, serviceId: string, input: ServiceInput): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'services', serviceId), {
    name: input.name,
    durationMinutes: input.durationMinutes,
    price: input.price,
    category: input.category ?? null,
  });
}

export async function deleteService(businessId: string, serviceId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'services', serviceId));
}
