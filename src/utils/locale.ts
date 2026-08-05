// Maps the app's i18n language to a BCP-47 locale tag for Intl-based date/time
// formatting (toLocaleDateString/toLocaleTimeString), so calendars, weekday
// names, and clock format (12h vs 24h) follow the selected app language.
export function localeTag(language: string): string {
  return language === 'sq' ? 'sq-AL' : 'en-US';
}
