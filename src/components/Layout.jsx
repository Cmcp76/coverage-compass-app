import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FooterDisclaimer } from './Disclaimer.jsx'
import LanguageSelector from './LanguageSelector.jsx'
import { usePolicy } from '../context/PolicyContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { SUPPORTED_LANGUAGE_CODES } from '../i18n/languages.js'
import { localePath } from '../utils/localeRouting.js'

const navLinks = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/upload', labelKey: 'nav.reviewMyCoverage' },
  { to: '/tools', labelKey: 'nav.tools' },
  { to: '/learning-center', labelKey: 'nav.learningCenter' },
  { to: '/business', labelKey: 'nav.business' },
  { to: '/trucking-startup', labelKey: 'nav.truckingFmcsa' },
  { to: '/claims-help', labelKey: 'nav.claimsHelp' },
  { to: '/about', labelKey: 'nav.about' },
]

const preAuthPaths = ['/', '/login', '/signup', '/reset-password', '/verify-email']
// Auth-flow pages only (no '/') - these hide the main nav for a focused,
// distraction-free layout. The landing page keeps the nav (isPreAuth below
// still keeps its Log In/Sign Up buttons instead of the account menu,
// since a landing-page visitor hasn't signed in either way).
const hideNavPaths = ['/login', '/signup', '/reset-password', '/verify-email']

const pageTitles = {
  '/': 'Coverage Compass — Understand Your Insurance, Find Better Options',
  '/signup': 'Sign Up — Coverage Compass',
  '/login': 'Log In — Coverage Compass',
  '/reset-password': 'Reset Password — Coverage Compass',
  '/verify-email': 'Verify Your Email — Coverage Compass',
  '/welcome': 'Welcome — Coverage Compass',
  '/dashboard': 'Dashboard — Coverage Compass',
  '/upload': 'Upload Your Policy — Coverage Compass',
  '/ai-review': 'Policy Summary — Coverage Compass',
  '/score': 'Your Coverage Score — Coverage Compass',
  '/gap-report': 'Coverage Gap Report — Coverage Compass',
  '/report': 'Your Report — Coverage Compass',
  '/reports': 'Your Reports — Coverage Compass',
  '/notifications': 'Notifications — Coverage Compass',
  '/learning-center': 'Learning Center — Coverage Compass',
  '/tools': 'Insurance Tools — Coverage Compass',
  '/challenge': 'The Coverage Compass Challenge',
  '/trucking-startup': 'Start My Trucking Company — Coverage Compass',
  '/business': 'Business Insurance — Coverage Compass',
  '/claims-help': 'Claims Help — Coverage Compass',
  '/about': 'About — Coverage Compass',
  '/privacy': 'Privacy Policy — Coverage Compass',
  '/terms': 'Terms of Service — Coverage Compass',
}
// pageTitles above covers every real route exactly, so any logicalPath that
// misses it is the "*" catch-all (NotFound.jsx) rather than a legitimate
// page still loading - falling back to a generic title there left the
// browser tab (and anything reading it, like a screen reader announcing the
// page change) saying "Coverage Compass" on a broken link, with no hint
// anything went wrong, even though the page itself visibly says "Page Not
// Found."
const notFoundTitle = 'Page Not Found — Coverage Compass'

// Only the genuinely public, shareable/indexable pages get an override here.
// Interior app pages (Dashboard, Upload, AIReview, Score, GapReport, Report,
// Reports, Notifications, the auth screens) show user-specific derived data,
// so the site-wide default in index.html's <meta name="description"> is a
// perfectly fine fallback for them, same as it always was before per-route
// titles existed.
const pageDescriptions = {
  '/challenge': 'Take the 5-minute Coverage Compass Challenge, a short quiz on common insurance coverage gaps, with a plain-language explanation for every answer.',
  '/trucking-startup': 'A step-by-step checklist for starting a trucking company: business formation, FMCSA authority, driver and vehicle compliance, and the insurance coverage that matches your operation.',
  '/learning-center': "Plain-language articles on auto, home, renters, and business insurance, so you understand your coverage before you ever need to file a claim.",
  '/tools': 'Free interactive insurance tools: a deductible calculator, coverage comparison tool, home inventory tracker, and annual policy checkup.',
  '/about': 'Learn about Coverage Compass, an independent insurance education platform that helps you understand your policy in plain language.',
  '/business': 'Upload your general liability or workers’ compensation policy for a plain-language review of what your business coverage actually includes.',
  '/claims-help': 'General, plain-language guidance for what to do when you need to file an insurance claim, from documenting damage to following up on a stalled claim.',
  '/privacy': "Coverage Compass's privacy policy: what this prototype collects, how it's used, and what stays only in your browser.",
  '/terms': "Coverage Compass's terms of service for using this educational insurance prototype.",
}
const defaultDescription =
  "Coverage Compass turns your insurance policy into plain language. Upload a policy to see what's covered, what might be missing, and what to ask your insurance professional before you ever file a claim."

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { reset } = usePolicy()
  const { user, logOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation('common')
  // Layout renders as an ancestor of <Routes>, not a descendant of the
  // matched Route, so useParams() can't see the :lang segment here — read
  // the language i18next/LocaleLayout already resolved instead. To match
  // pageTitles/pageDescriptions/preAuthPaths (all keyed by the pre-i18n,
  // un-prefixed path shape, e.g. "/dashboard"), strip that language segment
  // back off the real pathname before doing any of those lookups.
  const lang = i18n.language
  const pathSegments = location.pathname.split('/')
  const logicalPath = SUPPORTED_LANGUAGE_CODES.includes(pathSegments[1])
    ? '/' + pathSegments.slice(2).join('/')
    : location.pathname
  const isPreAuth =
    preAuthPaths.includes(logicalPath) ||
    (logicalPath === '/challenge' && !location.state?.fromApp)
  const hideNav =
    hideNavPaths.includes(logicalPath) ||
    (logicalPath === '/challenge' && !location.state?.fromApp)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountButtonRef = useRef(null)
  const accountMenuRef = useRef(null)
  const menuButtonRef = useRef(null)
  const mobileNavRef = useRef(null)
  const wasAccountMenuOpen = useRef(false)
  const wasMenuOpen = useRef(false)

  useEffect(() => {
    setMenuOpen(false)
    setAccountMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = pageTitles[logicalPath] || notFoundTitle
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', pageDescriptions[logicalPath] || defaultDescription)
  }, [logicalPath])

  useEffect(() => {
    if (!menuOpen && !accountMenuOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setAccountMenuOpen(false)
      }
    }
    function handleClickOutside(e) {
      // Scoped per-menu (its own trigger + panel), not "anywhere in the
      // header" - the account-menu trigger (sm+) and the hamburger trigger
      // (below lg) are both visible in the sm-lg range, and a header-wide
      // check meant clicking one trigger, or an unrelated header control
      // like the theme toggle, never counted as an "outside click" for the
      // other menu, so it could stay open indefinitely.
      if (
        accountMenuOpen &&
        !accountButtonRef.current?.contains(e.target) &&
        !accountMenuRef.current?.contains(e.target)
      ) {
        setAccountMenuOpen(false)
      }
      if (
        menuOpen &&
        !menuButtonRef.current?.contains(e.target) &&
        !mobileNavRef.current?.contains(e.target)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, accountMenuOpen])

  useEffect(() => {
    if (accountMenuOpen) {
      accountMenuRef.current?.querySelector('[role="menuitem"]')?.focus()
    } else if (wasAccountMenuOpen.current) {
      accountButtonRef.current?.focus()
    }
    wasAccountMenuOpen.current = accountMenuOpen
  }, [accountMenuOpen])

  useEffect(() => {
    if (menuOpen) {
      mobileNavRef.current?.querySelector('a, button')?.focus()
    } else if (wasMenuOpen.current) {
      menuButtonRef.current?.focus()
    }
    wasMenuOpen.current = menuOpen
  }, [menuOpen])

  function trapTabKey(e, containerRef) {
    if (e.key !== 'Tab') return
    const focusables = containerRef.current?.querySelectorAll('a, button')
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function handleLogOut() {
    reset()
    // Not awaited: logOut() clears local auth state synchronously before
    // its network call to revoke the server-side session, so the person
    // sees an instant logout regardless of how long (or whether) that
    // request succeeds.
    logOut()
    setMenuOpen(false)
    setAccountMenuOpen(false)
    navigate(localePath(lang, '/'))
  }

  // Falls back to the sample "Maria Alvarez" persona when signed out,
  // matching the rest of the app's demo-data-until-you-sign-up behavior
  // rather than showing a blank/generic account state.
  const displayName = user?.fullName || user?.email || 'Maria Alvarez'
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'MA'

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-20 border-b border-compass-line bg-compass-surface/90 backdrop-blur print:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to={localePath(lang, '/')} className="flex shrink-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
            <CompassMark />
            <span className="hidden font-display text-lg font-semibold text-compass-heading sm:inline">
              {t('brand.name')}
            </span>
          </Link>
          {!hideNav && (
            <nav className="hidden items-center gap-3.5 xl:gap-5 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={localePath(lang, link.to)}
                  className={`whitespace-nowrap text-[13px] font-medium transition xl:text-sm ${
                    logicalPath === link.to
                      ? 'text-compass-link'
                      : 'text-compass-slate hover:text-compass-ink'
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1 sm:gap-3">
            <LanguageSelector />
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-compass-line text-compass-slate transition hover:text-compass-ink sm:h-9 sm:w-9"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
            >
              <ThemeIcon dark={theme === 'dark'} />
            </button>
            {isPreAuth ? (
              <>
                <Link to={localePath(lang, '/login')} className="btn-secondary shrink-0 whitespace-nowrap px-2.5 py-2 sm:px-5 sm:py-2.5">
                  {t('nav.logIn')}
                </Link>
                <Link to={localePath(lang, '/signup')} className="btn-primary shrink-0 whitespace-nowrap px-2.5 py-2 sm:px-5 sm:py-2.5">
                  {t('nav.startFreeReview')}
                </Link>
              </>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  ref={accountButtonRef}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-compass-slate transition hover:bg-compass-paper"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((v) => !v)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-compass-navy text-xs font-semibold text-white">
                    {initials}
                  </span>
                  {displayName}
                  <ChevronIcon open={accountMenuOpen} />
                </button>
                {accountMenuOpen && (
                  <div
                    ref={accountMenuRef}
                    role="menu"
                    onKeyDown={(e) => trapTabKey(e, accountMenuRef)}
                    className="absolute end-0 top-full mt-2 w-44 rounded-lg border border-compass-line bg-compass-surface py-1 shadow-card"
                  >
                    <Link
                      to={localePath(lang, '/dashboard')}
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-compass-ink hover:bg-compass-paper"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      role="menuitem"
                      onClick={handleLogOut}
                      className="block w-full px-4 py-2 text-start text-sm text-compass-ink hover:bg-compass-paper"
                    >
                      {t('nav.logOut')}
                    </button>
                  </div>
                )}
              </div>
            )}
            {!hideNav && (
              <button
                ref={menuButtonRef}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-compass-line lg:hidden"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MenuIcon open={menuOpen} />
              </button>
            )}
          </div>
        </div>

        {!hideNav && menuOpen && (
          <nav
            ref={mobileNavRef}
            className="flex flex-col border-t border-compass-line bg-compass-surface px-6 py-3 lg:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={localePath(lang, link.to)}
                onClick={() => setMenuOpen(false)}
                className={`py-2 text-sm font-medium ${
                  logicalPath === link.to
                    ? 'text-compass-link'
                    : 'text-compass-slate'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            {!isPreAuth && (
              <div className="mt-2 flex items-center justify-between border-t border-compass-line pt-3 sm:hidden">
                <span className="flex items-center gap-2 text-sm text-compass-slate">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-compass-navy text-xs font-semibold text-white">
                    {initials}
                  </span>
                  {displayName}
                </span>
                <button onClick={handleLogOut} className="text-sm font-medium text-compass-link">
                  {t('nav.logOut')}
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-compass-line bg-compass-surface print:hidden">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-sm text-compass-heading">
              {t('brand.tagline')}
            </p>
            <div className="flex gap-5 text-sm text-compass-slate">
              <Link to={localePath(lang, '/about')} className="hover:text-compass-link">
                {t('footer.about')}
              </Link>
              <Link to={localePath(lang, '/privacy')} className="hover:text-compass-link">
                {t('footer.privacyPolicy')}
              </Link>
              <Link to={localePath(lang, '/terms')} className="hover:text-compass-link">
                {t('footer.termsOfService')}
              </Link>
              <Link to={localePath(lang, '/learning-center')} className="hover:text-compass-link">
                {t('footer.learningCenter')}
              </Link>
            </div>
          </div>
          <FooterDisclaimer />
        </div>
      </footer>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-compass-ink">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function ThemeIcon({ dark }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dark ? (
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

function CompassMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" className="text-compass-link" stroke="currentColor" strokeWidth="1.5" />
      {/* Cardinal tick marks on the dial rim. */}
      <g className="text-compass-slate" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M14 1.8v2.5" />
        <path d="M14 23.7v2.5" />
        <path d="M26.2 14h-2.5" />
        <path d="M1.8 14h2.5" />
      </g>
      {/* North/South needle, the standard compass silhouette. */}
      <path d="M14 6L16.3 14L14 12.7L11.7 14Z" className="text-compass-green" fill="currentColor" />
      <path d="M14 22L16.3 14L14 15.3L11.7 14Z" className="text-compass-heading" fill="currentColor" />
      <circle cx="14" cy="14" r="1.4" className="text-compass-heading" fill="currentColor" />
    </svg>
  )
}
