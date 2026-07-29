// Single source of truth for every supported language.
// To add a new language later (French, Arabic, Vietnamese, etc.):
//   1. Add an entry here
//   2. Create src/i18n/locales/{code}/*.json translation files
//   3. Import them in src/i18n/index.js
// Nothing else in the app needs to change — the language selector,
// routing, RTL layout, and locale formatting all read from this file.

export const LANGUAGES = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr',
    intlLocale: 'en-US', // used for Intl.DateTimeFormat / NumberFormat
    currency: 'USD',
    flag: '🇺🇸',
  },
  es: {
    code: 'es',
    label: 'Spanish',
    nativeLabel: 'Español',
    dir: 'ltr',
    intlLocale: 'es-US', // US-Spanish number/date conventions; use 'es-ES' or 'es-MX' if preferred
    currency: 'USD',
    flag: '🇪🇸',
  },

  // ---- Ready to enable — uncomment and add matching /locales/{code} files ----
  // fr: {
  //   code: 'fr',
  //   label: 'French',
  //   nativeLabel: 'Français',
  //   dir: 'ltr',
  //   intlLocale: 'fr-FR',
  //   currency: 'EUR',
  //   flag: '🇫🇷',
  // },
  // ar: {
  //   code: 'ar',
  //   label: 'Arabic',
  //   nativeLabel: 'العربية',
  //   dir: 'rtl',
  //   intlLocale: 'ar-SA',
  //   currency: 'USD',
  //   flag: '🇸🇦',
  // },
  // vi: {
  //   code: 'vi',
  //   label: 'Vietnamese',
  //   nativeLabel: 'Tiếng Việt',
  //   dir: 'ltr',
  //   intlLocale: 'vi-VN',
  //   currency: 'USD',
  //   flag: '🇻🇳',
  // },
};

export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGE_CODES = Object.keys(LANGUAGES);

export function isSupportedLanguage(code) {
  return SUPPORTED_LANGUAGE_CODES.includes(code);
}

export function getLanguage(code) {
  return LANGUAGES[code] || LANGUAGES[DEFAULT_LANGUAGE];
}

export function isRTL(code) {
  return getLanguage(code).dir === 'rtl';
}
