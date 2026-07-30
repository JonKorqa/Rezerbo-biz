import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const collectionName = 'transactions';

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
