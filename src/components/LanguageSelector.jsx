// Visible language selector. Drop it in the header/nav. Works anywhere in
// the app — it reads current language from the URL, updates i18next,
// persists the choice, and re-routes to the equivalent page in the new
// language (e.g. /en/dashboard -> /es/dashboard).

import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { LANGUAGES, SUPPORTED_LANGUAGE_CODES } from '../i18n/languages'
import { saveLanguagePreference } from '../i18n'

export default function LanguageSelector({ className = '' }) {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  // This renders inside Layout, which sits above <Routes> in the tree, so
  // useParams() can't see the :lang route segment from here — read it
  // straight off the URL instead (with i18n.language as a fallback for the
  // brief instant before the "/" -> "/:lang" redirect resolves).
  const firstSegment = location.pathname.split('/')[1]
  const currentLang = SUPPORTED_LANGUAGE_CODES.includes(firstSegment) ? firstSegment : i18n.language

  function handleChange(event) {
    const nextLang = event.target.value
    if (nextLang === currentLang) return

    saveLanguagePreference(nextLang)
    i18n.changeLanguage(nextLang)

    // Swap the /:lang segment in the current path, preserving the rest of
    // the route (e.g. /en/reports/123 -> /es/reports/123)
    const pathSegments = location.pathname.split('/')
    if (SUPPORTED_LANGUAGE_CODES.includes(pathSegments[1])) {
      pathSegments[1] = nextLang
    } else {
      pathSegments.splice(1, 0, nextLang)
    }
    navigate(pathSegments.join('/') || `/${nextLang}`, { replace: true })
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="language-selector" className="sr-only">
        {t('language.selectLanguage')}
      </label>
      <select
        id="language-selector"
        value={currentLang || i18n.language}
        onChange={handleChange}
        aria-label={t('language.selectLanguage')}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-compass-line
                   bg-compass-surface py-1.5 ps-3 pe-8 text-sm font-medium text-compass-ink
                   transition hover:text-compass-heading focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-compass-blue"
      >
        {Object.values(LANGUAGES).map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeLabel}
          </option>
        ))}
      </select>
      {/* Custom chevron so the native <select> arrow doesn't clash with RTL mirroring */}
      <svg
        className="pointer-events-none absolute end-2.5 h-4 w-4 text-compass-slate"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
