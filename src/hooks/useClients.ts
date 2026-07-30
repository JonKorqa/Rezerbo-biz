import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessClients } from '../services/clients';

export function useClients() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['clients', uid],
    queryFn: () => (uid ? getBusinessClients(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
