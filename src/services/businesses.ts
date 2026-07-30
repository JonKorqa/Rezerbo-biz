import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Business, BusinessHours, BusinessLocationData } from '../types/business';

const collectionName = 'businesses';

export async function getBusiness(uid: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, collectionName, uid));
  return snap.exists() ? (snap.data() as Business) : null;
}

export async function saveBusinessInfo(
  uid: string,
  data: { businessName: string; ownerName: string; phone: string; countryCode: string },
) {
  await setDoc(
    doc(db, collectionName, uid),
    {
      ownerUid: uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function saveBusinessCategory(uid: string, category: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { category, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveBusinessLocation(uid: string, location: BusinessLocationData) {
  await setDoc(
    doc(db, collectionName, uid),
    { location, onboardingComplete: true, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveBusinessHours(uid: string, hours: BusinessHours) {
  await setDoc(
    doc(db, collectionName, uid),
    { hours, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
