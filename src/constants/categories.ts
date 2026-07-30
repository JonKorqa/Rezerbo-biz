import type { Ionicons } from '@expo/vector-icons';

export type BusinessCategory = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const PRIMARY_CATEGORIES: BusinessCategory[] = [
  { key: 'nails', label: 'Nails', icon: 'color-palette-outline' },
  { key: 'hair', label: 'Hair', icon: 'cut-outline' },
  { key: 'brows-lashes', label: 'Brows & Lashes', icon: 'eye-outline' },
  { key: 'braids-locs', label: 'Braids & Locs', icon: 'sparkles-outline' },
  { key: 'massage', label: 'Massage', icon: 'body-outline' },
  { key: 'barber', label: 'Barber', icon: 'man-outline' },
];

export const OTHER_CATEGORIES: BusinessCategory[] = [
  { key: 'skin-aesthetics', label: 'Skin & Aesthetics', icon: 'water-outline' },
  { key: 'makeup', label: 'Makeup', icon: 'brush-outline' },
  { key: 'spa', label: 'Spa & Wellness', icon: 'flower-outline' },
  { key: 'tattoo-piercing', label: 'Tattoo & Piercing', icon: 'flash-outline' },
  { key: 'hair-removal', label: 'Hair Removal', icon: 'sunny-outline' },
  { key: 'fitness', label: 'Fitness & Training', icon: 'barbell-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];
