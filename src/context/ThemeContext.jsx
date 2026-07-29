import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'coverage-compass-theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage unavailable (private browsing), fall through to system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

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

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
