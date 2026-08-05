import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import en from '../locales/en.json';
import sq from '../locales/sq.json';

export type AppLanguage = 'en' | 'sq';

export const LANGUAGE_STORAGE_KEY = 'rezervo-biz-language';

const resources = {
  en: { translation: en },
  sq: { translation: sq },
};

function detectDeviceLanguage(): AppLanguage {
  const deviceLanguageCode = Localization.getLocales()[0]?.languageCode;
  return deviceLanguageCode === 'sq' ? 'sq' : 'en';
}

// Resolves the stored preference first (set once the user manually switches
// language in Settings), then falls back to the device locale, then English.
export async function initI18n(): Promise<void> {
  let language: AppLanguage;
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    language = stored === 'en' || stored === 'sq' ? stored : detectDeviceLanguage();
  } catch {
    language = detectDeviceLanguage();
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
