import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessMemberships } from '../services/memberships';

export function useMemberships() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['memberships', uid],
    queryFn: () => (uid ? getBusinessMemberships(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
