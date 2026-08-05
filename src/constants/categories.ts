import type { Ionicons } from '@expo/vector-icons';

export type CategoryLabel = {
  sq: string;
  en: string;
};

export type BusinessCategory = {
  key: string;
  label: CategoryLabel;
  icon: keyof typeof Ionicons.glyphMap;
};

// Keys and labels must match the main Rezervo (consumer) app's official category list
// exactly — the consumer app filters businesses with `s.category === activeCategory`,
// so a mismatched key here would make a business invisible to that filter.
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { key: 'parukeri', label: { sq: 'Flokë', en: 'Hair' }, icon: 'cut-outline' },
  { key: 'thoje', label: { sq: 'Thonja', en: 'Nails' }, icon: 'color-palette-outline' },
  { key: 'kozmetike', label: { sq: 'Lëkurë', en: 'Skin' }, icon: 'water-outline' },
  { key: 'berber', label: { sq: 'Berber', en: 'Barber' }, icon: 'man-outline' },
  { key: 'spa', label: { sq: 'SPA', en: 'SPA' }, icon: 'flower-outline' },
  { key: 'masazh', label: { sq: 'Masazh', en: 'Massage' }, icon: 'body-outline' },
  { key: 'tatuazhe', label: { sq: 'Tatuazhe', en: 'Tattoo' }, icon: 'flash-outline' },
  { key: 'nuse', label: { sq: 'Makeup', en: 'Makeup' }, icon: 'brush-outline' },
  {
    key: 'estetike-mjekesore',
    label: { sq: 'Estetikë Mjekësore', en: 'Medical Aesthetics' },
    icon: 'medkit-outline',
  },
  { key: 'heqje-qimesh', label: { sq: 'Heqje Qimesh', en: 'Hair Removal' }, icon: 'sunny-outline' },
  { key: 'piercing', label: { sq: 'Piercing', en: 'Piercing' }, icon: 'sparkles-outline' },
  { key: 'kafsh', label: { sq: 'Veterinar', en: 'Veterinary' }, icon: 'paw-outline' },
  { key: 'shtepi', label: { sq: 'Të tjera', en: 'Other' }, icon: 'ellipsis-horizontal-outline' },
];
