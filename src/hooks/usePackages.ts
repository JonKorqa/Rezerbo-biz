import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessPackages } from '../services/packages';

export function usePackages() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['packages', uid],
    queryFn: () => (uid ? getBusinessPackages(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
