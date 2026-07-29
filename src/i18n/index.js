// i18next configuration. Import this once, as a side effect, before your
// <App /> renders (see src/main.jsx).

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_CODES } from './languages'

// Static imports keep translation loading instant (no network fetch, no
// flash-of-untranslated-content). Add one import pair per new language.
import enCommon from './locales/en/common.json'
import enGlossary from './locales/en/glossary.json'
import enErrors from './locales/en/errors.json'
import enEmails from './locales/en/emails.json'

import esCommon from './locales/es/common.json'
import esGlossary from './locales/es/glossary.json'
import esErrors from './locales/es/errors.json'
import esEmails from './locales/es/emails.json'

// ---- When you add French/Arabic/Vietnamese, import their JSON here too ----
// import frCommon from './locales/fr/common.json';
// import arCommon from './locales/ar/common.json';
// import viCommon from './locales/vi/common.json';

const resources = {
  en: {
    common: enCommon,
    glossary: enGlossary,
    errors: enErrors,
    emails: enEmails,
  },
  es: {
    common: esCommon,
    glossary: esGlossary,
    errors: esErrors,
    emails: esEmails,
  },
  // fr: { common: frCommon, ... },
  // ar: { common: arCommon, ... },
  // vi: { common: viCommon, ... },
}

const STORAGE_KEY = 'coverageCompass.language'

i18n
  // Detects browser/OS language, but only ever as a *default* — the user's
  // explicit choice (saved to localStorage) always wins, and the URL /:lang
  // segment always wins over both once present (handled in LocaleLayout).
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'glossary', 'errors', 'emails'],

    detection: {
      // Order of detection when no /:lang URL segment is present yet
      // (e.g. first visit to "/"). LocaleLayout redirects to /:lang right
      // after this resolves, so the URL becomes the durable source of truth.
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes output
    },

    react: {
      useSuspense: false, // avoids a loading flash on first paint
    },
  })

export function saveLanguagePreference(code) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently,
    // URL-based /:lang routing still works without persistence.
  }
}

export default i18n
