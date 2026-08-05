import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { BillingPeriod, Membership } from '../types/membership';

export async function getBusinessMemberships(businessId: string): Promise<Membership[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'memberships'));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? 'Membership',
      description: data.description || undefined,
      price: data.price ?? 0,
      billingPeriod: (data.billingPeriod as BillingPeriod) ?? 'monthly',
      includedServiceIds: Array.isArray(data.includedServiceIds) ? data.includedServiceIds : [],
      active: data.active ?? true,
    } satisfies Membership;
  });
}

export interface MembershipInput {
  name: string;
  description?: string;
  price: number;
  billingPeriod: BillingPeriod;
  includedServiceIds: string[];
  active: boolean;
}

export async function createMembership(businessId: string, input: MembershipInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'memberships'), {
    businessId,
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    billingPeriod: input.billingPeriod,
    includedServiceIds: input.includedServiceIds,
    active: input.active,
    createdAt: serverTimestamp(),
  });
}

export async function updateMembership(
  businessId: string,
  membershipId: string,
  input: MembershipInput,
): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'memberships', membershipId), {
    name: input.name,
    description: input.description ?? null,
    price: input.price,
    billingPeriod: input.billingPeriod,
    includedServiceIds: input.includedServiceIds,
    active: input.active,
  });
}

export async function deleteMembership(businessId: string, membershipId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'memberships', membershipId));
}
