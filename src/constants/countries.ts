export type Country = {
  code: string; // ISO alpha-2
  name: string;
  dialCode: string;
  flag: string;
};

// Kosovo first — default for this market. Followed by neighboring/common
// countries, roughly alphabetical after that.
export const COUNTRIES: Country[] = [
  { code: 'XK', name: 'Kosovo', dialCode: '+383', flag: '\u{1F1FD}\u{1F1F0}' },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '\u{1F1E6}\u{1F1F1}' },
  { code: 'MK', name: 'North Macedonia', dialCode: '+389', flag: '\u{1F1F2}\u{1F1F0}' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '\u{1F1F2}\u{1F1EA}' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '\u{1F1F7}\u{1F1F8}' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '\u{1F1FA}\u{1F1F8}' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
