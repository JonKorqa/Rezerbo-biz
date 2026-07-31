export interface BusinessLocationData {
  lat: number;
  lng: number;
  address: string;
  unit?: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayHours {
  closed: boolean;
  start: string;
  end: string;
}

export type BusinessHours = Record<DayOfWeek, DayHours>;

export interface Business {
  ownerUid: string;
  businessName: string;
  ownerName: string;
  phone: string;
  countryCode: string;
  category?: string;
  location?: BusinessLocationData;
  hours?: BusinessHours;
  coverPhotoUrl?: string;
  photoUrl?: string;
  portfolio?: string[];
  instagramHandle?: string;
  onboardingComplete?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
