import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { StaffMember } from '../types/staff';

export async function getBusinessStaff(businessId: string): Promise<StaffMember[]> {
  const snap = await getDocs(collection(db, 'businesses', businessId, 'staff'));
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name ?? '',
      phone: data.phone ?? '',
      role: data.role === 'Owner' ? 'Owner' : 'Staff',
      email: data.email || undefined,
      active: data.active ?? true,
    } satisfies StaffMember;
  });
}

export interface StaffInput {
  name: string;
  phone: string;
  role: 'Owner' | 'Staff';
  email?: string;
  active: boolean;
}

export async function createStaffMember(businessId: string, input: StaffInput): Promise<void> {
  await addDoc(collection(db, 'businesses', businessId, 'staff'), {
    businessId,
    name: input.name,
    phone: input.phone,
    role: input.role,
    email: input.email ?? null,
    active: input.active,
    createdAt: serverTimestamp(),
  });
}

export async function updateStaffMember(businessId: string, staffId: string, input: StaffInput): Promise<void> {
  await updateDoc(doc(db, 'businesses', businessId, 'staff', staffId), {
    name: input.name,
    phone: input.phone,
    role: input.role,
    email: input.email ?? null,
    active: input.active,
  });
}

export async function deleteStaffMember(businessId: string, staffId: string): Promise<void> {
  await deleteDoc(doc(db, 'businesses', businessId, 'staff', staffId));
}
