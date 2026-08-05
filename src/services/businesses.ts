import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Business, BusinessHours, BusinessLocationData, TimeOffEntry } from '../types/business';

const collectionName = 'businesses';

export async function getBusiness(uid: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, collectionName, uid));
  return snap.exists() ? (snap.data() as Business) : null;
}

// Generic merge-write for the Business Details screen's sections, which each save a
// handful of unrelated fields — avoids one single-purpose setter per field.
export async function updateBusiness(uid: string, data: Partial<Business>) {
  await setDoc(
    doc(db, collectionName, uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
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

export async function saveCalendarColor(uid: string, calendarColor: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { calendarColor, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function addTimeOff(uid: string, entry: TimeOffEntry) {
  await setDoc(
    doc(db, collectionName, uid),
    { timeOff: arrayUnion(entry), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Deletes everything Firestore doesn't cascade-delete on its own: the clients/services
// subcollections, and the top-level appointments/transactions docs scoped by businessId.
// The business doc itself (and any fields on it, e.g. timeOff) is removed last.
export async function deleteBusinessAccount(uid: string): Promise<void> {
  const [clients, services, appointments, transactions] = await Promise.all([
    getDocs(collection(db, collectionName, uid, 'clients')),
    getDocs(collection(db, collectionName, uid, 'services')),
    getDocs(query(collection(db, 'appointments'), where('businessId', '==', uid))),
    getDocs(query(collection(db, 'transactions'), where('businessId', '==', uid))),
  ]);

  await Promise.all([
    ...clients.docs.map((d) => deleteDoc(d.ref)),
    ...services.docs.map((d) => deleteDoc(d.ref)),
    ...appointments.docs.map((d) => deleteDoc(d.ref)),
    ...transactions.docs.map((d) => deleteDoc(d.ref)),
  ]);

  await deleteDoc(doc(db, collectionName, uid));
}

export async function saveBusinessCoverPhoto(uid: string, coverPhotoUrl: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { coverPhotoUrl, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveBusinessPhoto(uid: string, photoUrl: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { photoUrl, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveInstagramHandle(uid: string, instagramHandle: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { instagramHandle, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function addPortfolioImage(uid: string, imageUrl: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { portfolio: arrayUnion(imageUrl), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function removePortfolioImage(uid: string, imageUrl: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { portfolio: arrayRemove(imageUrl), updatedAt: serverTimestamp() },
    { merge: true },
  );
}
