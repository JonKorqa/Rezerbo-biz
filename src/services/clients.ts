import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Client } from '../types/client';

export async function getBusinessClients(businessId: string): Promise<Client[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'clients'));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? '',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
    } satisfies Client;
  });
}

export interface NewClientInput {
  firstName: string;
  lastName: string;
  phone: string;
}

export async function createClient(businessId: string, input: NewClientInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'clients'), {
    businessId,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    createdAt: serverTimestamp(),
  });
}

export async function updateClient(businessId: string, clientId: string, input: NewClientInput): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'clients', clientId), {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
  });
}

export async function deleteClient(businessId: string, clientId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'clients', clientId));
}
