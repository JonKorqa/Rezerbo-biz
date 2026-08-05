import type { Ionicons } from '@expo/vector-icons';

export type Amenity = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap };

export const AMENITIES: Amenity[] = [
  { key: 'parking', label: 'Parking Available', icon: 'car-outline' },
  { key: 'credit-cards', label: 'Credit Cards Accepted', icon: 'card-outline' },
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi-outline' },
  { key: 'child-friendly', label: 'Child Friendly', icon: 'happy-outline' },
  { key: 'pets-allowed', label: 'Pets Allowed', icon: 'paw-outline' },
  { key: 'wheelchair-accessible', label: 'Wheelchair Accessible', icon: 'accessibility-outline' },
  { key: 'air-conditioning', label: 'Air Conditioning', icon: 'snow-outline' },
  { key: 'restroom', label: 'Restroom Available', icon: 'water-outline' },
  { key: 'complimentary-drinks', label: 'Complimentary Drinks', icon: 'cafe-outline' },
  { key: 'music', label: 'Music', icon: 'musical-notes-outline' },
];
