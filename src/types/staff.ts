export type StaffRole = 'Owner' | 'Staff';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  email?: string;
  active: boolean;
  // True for the synthesized owner entry (read from the business doc), which has no
  // Firestore doc of its own under businesses/{uid}/staff and can't be edited/deleted here.
  isOwner?: boolean;
}
