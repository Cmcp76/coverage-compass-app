import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FooterDisclaimer } from './Disclaimer.jsx'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload Policy' },
  { to: '/reports', label: 'Reports' },
  { to: '/learning-center', label: 'Learning Center' },
  { to: '/tools', label: 'Tools' },
  { to: '/notifications', label: 'Notifications' },
]

const preAuthPaths = ['/', '/login', '/signup', '/reset-password', '/verify-email']

export default function Layout({ children }) {
  const location = useLocation()
  const isPreAuth = preAuthPaths.includes(location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen flex-col">
      <header
        ref={headerRef}
        className="sticky top-0 z-20 border-b border-compass-line bg-white/90 backdrop-blur print:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <CompassMark />
            <span className="font-display text-lg font-semibold text-compass-navy">
              Coverage Compass
            </span>
          </Link>
          {!isPreAuth && (
            <nav className="hidden items-center gap-6 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition ${
                    location.pathname === link.to
                      ? 'text-compass-blue'
                      : 'text-compass-slate hover:text-compass-ink'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-3">
            {isPreAuth ? (
              <>
                <Link to="/login" className="btn-secondary">
                  Log In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-2 text-sm font-medium text-compass-slate sm:flex"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-compass-navy text-xs font-semibold text-white">
                    MA
                  </span>
                  Maria Alvarez
                </Link>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-compass-line lg:hidden"
                  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <MenuIcon open={menuOpen} />
                </button>
              </>
            )}
          </div>
        </div>

        {!isPreAuth && menuOpen && (
          <nav className="flex flex-col border-t border-compass-line bg-white px-6 py-3 lg:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`py-2 text-sm font-medium ${
                  location.pathname === link.to
                    ? 'text-compass-blue'
                    : 'text-compass-slate'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-compass-line bg-white print:hidden">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-sm text-compass-navy">
              Helping people understand insurance before they need it.
            </p>
            <div className="flex gap-5 text-sm text-compass-slate">
              <Link to="/" className="hover:text-compass-blue">
                About
              </Link>
              <Link to="/" className="hover:text-compass-blue">
                Privacy Policy
              </Link>
              <Link to="/" className="hover:text-compass-blue">
                Terms of Service
              </Link>
              <Link to="/learning-center" className="hover:text-compass-blue">
                Learning Center
              </Link>
            </div>
          </div>
          <FooterDisclaimer />
        </div>
      </footer>
    </div>
  )
}

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="#1A2433"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="#1A2433"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function CompassMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" stroke="#1D5FA6" strokeWidth="1.5" />
      <path d="M18 10L14.5 14.5L10 18L13.5 13.5L18 10Z" fill="#1D9E75" />
    </svg>
  )
}
