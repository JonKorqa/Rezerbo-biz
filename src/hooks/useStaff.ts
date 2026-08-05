import { useQuery } from '@tanstack/react-query';
import { auth } from '../services/firebase';
import { getBusiness } from '../services/businesses';
import { getBusinessStaff } from '../services/staff';
import type { StaffMember } from '../types/staff';

const OWNER_ID = 'owner';

export function useStaff() {
  const uid = auth.currentUser?.uid;
  return useQuery({
    queryKey: ['staff', uid],
    queryFn: async (): Promise<StaffMember[]> => {
      if (!uid) return [];
      const [business, staff] = await Promise.all([
        getBusiness(uid).catch(() => null),
        getBusinessStaff(uid).catch(() => []),
      ]);
      const owner: StaffMember = {
        id: OWNER_ID,
        name: business?.ownerName || 'You',
        phone: business?.phone ?? '',
        role: 'Owner',
        active: true,
        isOwner: true,
      };
      return [owner, ...staff];
    },
    enabled: !!uid,
  });
}
