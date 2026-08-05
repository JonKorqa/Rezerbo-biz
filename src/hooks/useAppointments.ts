import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusinessAppointments } from '../services/appointments';

export function useAppointments() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['appointments', uid],
    queryFn: () => (uid ? getBusinessAppointments(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });
}
