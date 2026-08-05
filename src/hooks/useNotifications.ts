import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessNotifications } from '../services/notifications';

export function useNotifications() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['notifications', uid],
    queryFn: () => (uid ? getBusinessNotifications(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
