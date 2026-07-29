// Small helpers for working with locale-prefixed URLs (/en/..., /es/...).

import { DEFAULT_LANGUAGE, isSupportedLanguage } from '../i18n/languages'

/**
 * Build a locale-prefixed path. Use this instead of hardcoding paths so
 * links always point at the current language.
 *
 *   localePath('es', '/dashboard')       -> '/es/dashboard'
 *   localePath('en', 'reports/123')      -> '/en/reports/123'
 */
export function localePath(lang, path = '') {
  const safeLang = isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `/${safeLang}${cleanPath === '/' ? '' : cleanPath}`
}

/**
 * Given the browser's reported languages (navigator.languages), return the
 * best-matching supported language code. i18next-browser-languagedetector
 * already does this for initial load — this helper is exposed for any
 * server-side or edge-redirect logic you add later (e.g. a Vite/Node
 * middleware that 302s "/" to "/es" based on Accept-Language headers).
 */
export function detectBestLanguage(acceptedLanguages = navigator.languages || []) {
  for (const locale of acceptedLanguages) {
    const base = locale.split('-')[0].toLowerCase()
    if (isSupportedLanguage(base)) return base
  }
  return DEFAULT_LANGUAGE
}
