import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessTransactions } from '../services/transactions';

export function useTransactions() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['transactions', uid],
    queryFn: () => (uid ? getBusinessTransactions(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
