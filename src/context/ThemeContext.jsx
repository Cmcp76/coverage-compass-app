import { createContext, useContext, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'coverage-compass-theme'

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    // localStorage unavailable (private browsing).
    return null
  }
}

function getInitialTheme() {
  return getSavedTheme() || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  // Tracks whether the person (this session or a previous one) has ever
  // explicitly chosen a theme. Only when that's false do we keep following
  // the OS-level preference live, otherwise a manual choice would get
  // silently overridden the next time the OS theme happens to change.
  const hasManualPreference = useRef(getSavedTheme() !== null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    // Keep the mobile browser chrome/status bar color in sync with the
    // in-app theme, not just the OS-level preference a static <meta> tag
    // would otherwise be stuck reflecting.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1a2d48' : '#ffffff')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Storage full or unavailable, theme just won't persist across reloads.
    }
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    function handleChange(e) {
      if (hasManualPreference.current) return
      setTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  function toggleTheme() {
    hasManualPreference.current = true
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
