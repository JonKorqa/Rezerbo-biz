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

export interface TimeOffEntry {
  id: string;
  // Local YYYY-MM-DD dates, inclusive on both ends. A single day off has startDate === endDate.
  startDate: string;
  endDate: string;
  label?: string;
}

export interface BusinessPolicies {
  cancellationPolicy?: string;
  noWaitingArea?: boolean;
  noWaitingAreaNote?: string;
  noOutsideGuests?: boolean;
  noOutsideGuestsNote?: string;
  healthSafetyRules?: string;
  additionalDetails?: string;
}

export interface Business {
  ownerUid: string;
  businessName: string;
  ownerName: string;
  phone: string;
  countryCode: string;
  // Single-select category, still written by onboarding's BusinessCategoryScreen.
  category?: string;
  // Multi-select categories, written by the Business Details screen.
  categories?: string[];
  bio?: string;
  location?: BusinessLocationData;
  hours?: BusinessHours;
  timeOff?: TimeOffEntry[];
  coverPhotoUrl?: string;
  photoUrl?: string;
  portfolio?: string[];
  instagramHandle?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  onlineShopUrl?: string;
  offersMobileServices?: boolean;
  mobileServiceArea?: string;
  amenities?: string[];
  policies?: BusinessPolicies;
  // Whether CheckoutCompleteScreen should prompt to send a receipt after every checkout.
  alwaysAskReceipt?: boolean;
  calendarColor?: string;
  onboardingComplete?: boolean;
  // Online Booking settings — read by the consumer-facing Rezervo app, not yet consumed anywhere in this app.
  offersOnlineBooking?: boolean;
  requireBookingApproval?: boolean;
  bookingLeadTimeMinutes?: number;
  bookingWindowDays?: number;
  // Advanced Options.
  retailInfo?: string;
  bufferTimeMinutes?: number;
  defaultServiceDurationMinutes?: number;
  // Personal Settings — in-app notification preferences, keyed to match NotificationType.
  notifyNewBooking?: boolean;
  notifyUpcomingReminder?: boolean;
  language?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
