import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessServices } from '../services/services';

export function useServices() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['services', uid],
    queryFn: () => (uid ? getBusinessServices(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
