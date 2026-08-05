import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ServicePackage } from '../types/package';

export async function getBusinessPackages(businessId: string): Promise<ServicePackage[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'packages'));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? 'Package',
      description: data.description || undefined,
      includedServiceIds: Array.isArray(data.includedServiceIds) ? data.includedServiceIds : [],
      price: data.price ?? 0,
      active: data.active ?? true,
    } satisfies ServicePackage;
  });
}

export interface PackageInput {
  name: string;
  description?: string;
  includedServiceIds: string[];
  price: number;
  active: boolean;
}

export async function createPackage(businessId: string, input: PackageInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'packages'), {
    businessId,
    name: input.name,
    description: input.description ?? null,
    includedServiceIds: input.includedServiceIds,
    price: input.price,
    active: input.active,
    createdAt: serverTimestamp(),
  });
}

export async function updatePackage(businessId: string, packageId: string, input: PackageInput): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'packages', packageId), {
    name: input.name,
    description: input.description ?? null,
    includedServiceIds: input.includedServiceIds,
    price: input.price,
    active: input.active,
  });
}

export async function deletePackage(businessId: string, packageId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'packages', packageId));
}
