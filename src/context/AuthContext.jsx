import { createContext, useContext, useEffect, useState } from 'react'
import { signup as apiSignup, login as apiLogin, logout as apiLogout, fetchMe, AuthNotConfiguredError } from '../lib/authApi.js'

export const TOKEN_KEY = 'coverage-compass-auth-token'

export function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function persistToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private browsing, etc.) - the session just
    // won't survive a reload, sign-in still works for this tab.
  }
}

const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  signUp: async () => {},
  logIn: async () => {},
  logOut: async () => {},
})

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(loadToken)
  const [user, setUser] = useState(null)
  // Starts true only when there's a stored token to verify against the
  // server - a guest with no token has nothing to wait on, and shouldn't
  // see any kind of "checking session" flash.
  const [loading, setLoading] = useState(Boolean(loadToken()))

  function setToken(newToken) {
    setTokenState(newToken)
    persistToken(newToken)
  }

  // A token surviving in localStorage doesn't mean it's still valid - the
  // server session could have expired or been revoked from another device.
  // Verify it on load (and whenever it changes) rather than trusting the
  // stored value blindly.
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchMe(token)
      .then(({ user: fetchedUser }) => {
        if (!cancelled) setUser(fetchedUser)
      })
      .catch(() => {
        // Covers both a genuinely invalid/expired token and
        // AuthNotConfiguredError (no backend deployed) - either way there's
        // no valid session to hold onto.
        if (!cancelled) {
          setUser(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function signUp({ email, password, fullName }) {
    const result = await apiSignup({ email, password, fullName })
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  async function logIn({ email, password }) {
    const result = await apiLogin({ email, password })
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  async function logOut() {
    const currentToken = token
    // Clear local state first - the person is "logged out" from this
    // browser's perspective the instant they ask, regardless of whether
    // the network call to revoke the server-side session succeeds.
    setUser(null)
    setToken(null)
    if (currentToken) {
      try {
        await apiLogout(currentToken)
      } catch {
        // Best-effort server-side revocation - a failure here doesn't
        // change the fact that this browser is now logged out.
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, logIn, logOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { AuthNotConfiguredError }
