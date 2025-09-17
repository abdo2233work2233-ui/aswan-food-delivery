import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files dynamically to avoid TypeScript issues
const enTranslations = require('./locales/en.json');
const arTranslations = require('./locales/ar.json');

const resources = {
  en: {
    translation: enTranslations
  },
  ar: {
    translation: arTranslations
  }
};

// Language direction helper
export const getLanguageDirection = (language: string): 'ltr' | 'rtl' => {
  return language === 'ar' ? 'rtl' : 'ltr';
};

// Supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  });

// Set initial direction
const initialLanguage = i18n.language || 'en';
const direction = getLanguageDirection(initialLanguage);
document.documentElement.dir = direction;
document.documentElement.lang = initialLanguage;

export default i18n;