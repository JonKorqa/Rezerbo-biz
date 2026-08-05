import type { Ionicons } from '@expo/vector-icons';

export type Amenity = {
  key: string;
  label: { sq: string; en: string };
  icon: keyof typeof Ionicons.glyphMap;
};

export const AMENITIES: Amenity[] = [
  { key: 'parking', label: { sq: 'Parking i Disponueshëm', en: 'Parking Available' }, icon: 'car-outline' },
  { key: 'credit-cards', label: { sq: 'Pranohen Kartela', en: 'Credit Cards Accepted' }, icon: 'card-outline' },
  { key: 'wifi', label: { sq: 'Wi-Fi', en: 'Wi-Fi' }, icon: 'wifi-outline' },
  { key: 'child-friendly', label: { sq: 'Miqësor për Fëmijë', en: 'Child Friendly' }, icon: 'happy-outline' },
  { key: 'pets-allowed', label: { sq: 'Lejohen Kafshët', en: 'Pets Allowed' }, icon: 'paw-outline' },
  {
    key: 'wheelchair-accessible',
    label: { sq: 'I Aksesueshëm me Karrocë', en: 'Wheelchair Accessible' },
    icon: 'accessibility-outline',
  },
  { key: 'air-conditioning', label: { sq: 'Klimatizim', en: 'Air Conditioning' }, icon: 'snow-outline' },
  { key: 'restroom', label: { sq: 'Tualet i Disponueshëm', en: 'Restroom Available' }, icon: 'water-outline' },
  {
    key: 'complimentary-drinks',
    label: { sq: 'Pije Falas', en: 'Complimentary Drinks' },
    icon: 'cafe-outline',
  },
  { key: 'music', label: { sq: 'Muzikë', en: 'Music' }, icon: 'musical-notes-outline' },
];

export function getAmenityLabel(amenity: Amenity, language: string): string {
  return language === 'sq' ? amenity.label.sq : amenity.label.en;
}
