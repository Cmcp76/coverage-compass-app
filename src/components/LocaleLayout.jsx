// Wraps every route nested under /:lang. Responsibilities:
//   1. Validate the :lang URL segment; redirect unsupported codes to default
//   2. Sync i18next's active language to the URL
//   3. Set <html lang="..."> and <html dir="ltr|rtl"> for RTL languages (Arabic)
//   4. Persist the resolved language as the user's saved preference
//
// This is the one place RTL layout switching happens — Tailwind's logical
// utilities (ps-*, pe-*, text-start, text-end, etc.) combined with the
// <html dir> attribute make the rest of the app automatically mirror for
// RTL languages without per-component conditionals.

import { useEffect } from 'react'
import { Outlet, useParams, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isSupportedLanguage, getLanguage, DEFAULT_LANGUAGE } from '../i18n/languages'
import { saveLanguagePreference } from '../i18n'

export default function LocaleLayout() {
  const { lang } = useParams()
  const { i18n } = useTranslation()
  const location = useLocation()
  const supported = isSupportedLanguage(lang)

  // Hooks must run unconditionally on every render, so the redirect for an
  // unsupported :lang segment can't happen before this — it's guarded
  // internally instead, and the render below bails out via <Navigate>.
  useEffect(() => {
    if (!supported) return

    const { dir } = getLanguage(lang)

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }

    document.documentElement.lang = lang
    document.documentElement.dir = dir

    saveLanguagePreference(lang)
  }, [lang, supported, i18n])

  if (!supported) {
    // Unsupported or missing language code — fall back to default. Keep the
    // *entire* original path rather than stripping the unrecognized first
    // segment off as if it were a language code: every real link into this
    // app from before the /:lang restructuring (sitemap.xml, robots.txt,
    // anything already indexed or bookmarked) is a bare top-level route
    // like /challenge or /about with nothing after it, where that segment
    // *is* the destination, not a language code. Stripping it turned every
    // one of those legacy links into a silent redirect to the homepage
    // instead of the page it named. Prepending instead of stripping fixes
    // that (/challenge -> /en/challenge) at the cost of a 404, rather than
    // a guess, for the much rarer case of someone hand-typing an actually
    // invalid language code in front of a real path (e.g. /xx/dashboard).
    return (
      <Navigate
        to={`/${DEFAULT_LANGUAGE}${location.pathname}${location.search}${location.hash}`}
        replace
      />
    )
  }

  return <Outlet />
}
