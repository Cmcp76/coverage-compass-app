import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FooterDisclaimer } from './Disclaimer.jsx'
import { usePolicy } from '../context/PolicyContext.jsx'

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
  const navigate = useNavigate()
  const { reset } = usePolicy()
  const isPreAuth = preAuthPaths.includes(location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const headerRef = useRef(null)

  useEffect(() => {
    setMenuOpen(false)
    setAccountMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen && !accountMenuOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setAccountMenuOpen(false)
      }
    }
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMenuOpen(false)
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen, accountMenuOpen])

  function handleLogOut() {
    reset()
    setMenuOpen(false)
    setAccountMenuOpen(false)
    navigate('/')
  }

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
                <div className="relative hidden sm:block">
                  <button
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-compass-slate transition hover:bg-compass-paper"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    onClick={() => setAccountMenuOpen((v) => !v)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-compass-navy text-xs font-semibold text-white">
                      MA
                    </span>
                    Maria Alvarez
                    <ChevronIcon open={accountMenuOpen} />
                  </button>
                  {accountMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-compass-line bg-white py-1 shadow-card"
                    >
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        onClick={() => setAccountMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-compass-ink hover:bg-compass-paper"
                      >
                        Dashboard
                      </Link>
                      <button
                        role="menuitem"
                        onClick={handleLogOut}
                        className="block w-full px-4 py-2 text-left text-sm text-compass-ink hover:bg-compass-paper"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
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
            <div className="mt-2 flex items-center justify-between border-t border-compass-line pt-3 sm:hidden">
              <span className="flex items-center gap-2 text-sm text-compass-slate">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-compass-navy text-xs font-semibold text-white">
                  MA
                </span>
                Maria Alvarez
              </span>
              <button onClick={handleLogOut} className="text-sm font-medium text-compass-blue">
                Log Out
              </button>
            </div>
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
