import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction } from '../types/transaction';

const collectionName = 'transactions';
const RECENT_LIMIT = 100;

export interface TransactionItemInput {
  name: string;
  price: number;
}

export interface NewTransactionInput {
  businessId: string;
  clientId: string | null;
  amount: number;
  method: 'cash';
  items: TransactionItemInput[];
}

export async function createTransaction(input: NewTransactionInput): Promise<void> {
  await addDoc(collection(db, collectionName), {
    businessId: input.businessId,
    clientId: input.clientId,
    amount: input.amount,
    method: input.method,
    items: input.items,
    status: 'paid',
    createdAt: serverTimestamp(),
  });
}

// Filters by businessId only (no orderBy) to avoid requiring a composite Firestore
// index — mirrors getBusinessAppointments. Recency ordering and the recent-N cap
// happen client-side instead.
export async function getBusinessTransactions(businessId: string): Promise<Transaction[]> {
  const snap = await getDocs(query(collection(db, collectionName), where('businessId', '==', businessId)));
  const transactions = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      businessId: data.businessId,
      clientId: data.clientId ?? null,
      amount: typeof data.amount === 'number' ? data.amount : 0,
      method: data.method ?? 'cash',
      items: Array.isArray(data.items) ? data.items : [],
      status: data.status ?? 'paid',
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt ?? 0),
    } satisfies Transaction;
  });
  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, RECENT_LIMIT);
}
