import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Service } from '../types/service';

const collectionName = 'services';

// Shown when a business hasn't set up real services yet, so the picker never renders empty.
const PLACEHOLDER_SERVICES: Omit<Service, 'businessId'>[] = [
  { id: 'placeholder-manicure', name: 'Manicure', durationMinutes: 40, price: 20, color: '#3B82F6' },
  { id: 'placeholder-pedicure', name: 'Pedicure', durationMinutes: 45, price: 25, color: '#22C55E' },
  { id: 'placeholder-haircut', name: 'Haircut', durationMinutes: 30, price: 35, color: '#F59E0B' },
];

export async function getBusinessServices(businessId: string): Promise<Service[]> {
  const snap = await getDocs(query(collection(db, collectionName), where('businessId', '==', businessId)));
  if (snap.empty) {
    return PLACEHOLDER_SERVICES.map((s) => ({ ...s, businessId }));
  }
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      businessId: data.businessId,
      name: data.name ?? 'Service',
      durationMinutes: data.durationMinutes ?? 30,
      price: data.price ?? 0,
      color: data.color,
    } satisfies Service;
  });
}
