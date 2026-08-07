import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Business, BusinessHours, BusinessLocationData, DayHours, TimeOffEntry } from '../types/business';

const collectionName = 'businesses';
const PROFILES_COLLECTION = 'businessProfiles';

// Keys from Business that are explicitly confirmed public-safe. Any key not listed here
// is treated as private and will never be written to the public profile.
const PUBLIC_KEYS = new Set<keyof Business>([
  'businessName',
  'phone',
  'countryCode',
  'bio',
  'category',
  'categories',
  'hours',
  'coverPhotoUrl',
  'photoUrl',
  'portfolio',
  'instagramHandle',
  'facebookUrl',
  'websiteUrl',
  'onlineShopUrl',
  'amenities',
  'policies',
  'offersOnlineBooking',
  'requireBookingApproval',
  'bookingLeadTimeMinutes',
  'bookingWindowDays',
  'offersMobileServices',
  'mobileServiceArea',
]);

function extractPublicFields(data: Partial<Business>): Record<string, unknown> {
  const pub: Record<string, unknown> = {};
  for (const key of PUBLIC_KEYS) {
    if (key in data) pub[key] = data[key];
  }
  return pub;
}

export async function getBusiness(uid: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, collectionName, uid));
  return snap.exists() ? (snap.data() as Business) : null;
}

// Generic merge-write for the Business Details screen's sections. Automatically
// mirrors any public-safe fields to businessProfiles/{uid} in the same call.
export async function updateBusiness(uid: string, data: Partial<Business>) {
  const pub = extractPublicFields(data);
  const writes: Promise<void>[] = [
    setDoc(
      doc(db, collectionName, uid),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ];
  if (Object.keys(pub).length > 0) {
    writes.push(
      setDoc(
        doc(db, PROFILES_COLLECTION, uid),
        { ...pub, updatedAt: serverTimestamp() },
        { merge: true },
      ),
    );
  }
  await Promise.all(writes);
}

export async function saveBusinessInfo(
  uid: string,
  data: { businessName: string; ownerName: string; phone: string; countryCode: string },
) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      {
        ownerUid: uid,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { businessName: data.businessName, phone: data.phone, countryCode: data.countryCode, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function saveBusinessCategory(uid: string, category: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { category, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { category, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function saveBusinessLocation(uid: string, location: BusinessLocationData) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { location, onboardingComplete: true, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    // location.unit is explicitly confirmed public-safe (lat/lng/address/unit all public).
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { location, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function saveBusinessHours(uid: string, hours: BusinessHours) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { hours, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { hours, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

// Sets (or replaces) a single date's custom hours, set via Schedule Management's
// Opening Calendar. merge:true deep-merges into the hoursOverrides map, so other
// dates' overrides are left untouched.
export async function saveHoursOverride(uid: string, dateKey: string, hours: DayHours) {
  await setDoc(
    doc(db, collectionName, uid),
    { hoursOverrides: { [dateKey]: hours }, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function removeHoursOverride(uid: string, dateKey: string) {
  await setDoc(
    doc(db, collectionName, uid),
    { hoursOverrides: { [dateKey]: deleteField() }, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function saveCalendarColor(uid: string, calendarColor: string) {
  // calendarColor is private — no public profile sync.
  await setDoc(
    doc(db, collectionName, uid),
    { calendarColor, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Syncs only {startDate, endDate} to the public profile — id and label are private.
export async function addTimeOff(uid: string, entry: TimeOffEntry) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { timeOff: arrayUnion(entry), updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      {
        timeOff: arrayUnion({ startDate: entry.startDate, endDate: entry.endDate }),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
  ]);
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

  await Promise.all([
    deleteDoc(doc(db, collectionName, uid)),
    deleteDoc(doc(db, PROFILES_COLLECTION, uid)),
  ]);
}

export async function saveBusinessCoverPhoto(uid: string, coverPhotoUrl: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { coverPhotoUrl, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { coverPhotoUrl, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function saveBusinessPhoto(uid: string, photoUrl: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { photoUrl, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { photoUrl, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function saveInstagramHandle(uid: string, instagramHandle: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { instagramHandle, updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { instagramHandle, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function addPortfolioImage(uid: string, imageUrl: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { portfolio: arrayUnion(imageUrl), updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { portfolio: arrayUnion(imageUrl), updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}

export async function removePortfolioImage(uid: string, imageUrl: string) {
  await Promise.all([
    setDoc(
      doc(db, collectionName, uid),
      { portfolio: arrayRemove(imageUrl), updatedAt: serverTimestamp() },
      { merge: true },
    ),
    setDoc(
      doc(db, PROFILES_COLLECTION, uid),
      { portfolio: arrayRemove(imageUrl), updatedAt: serverTimestamp() },
      { merge: true },
    ),
  ]);
}
