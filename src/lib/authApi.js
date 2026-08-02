// Calls the Coverage Compass Worker's account endpoints (see
// worker/src/authRoutes.js / analysesRoutes.js). Uses a bearer token, not
// cookies - the frontend (GitHub Pages) and the Worker (workers.dev) are
// different origins, and a header avoids all the cross-origin cookie
// complexity (SameSite=None + Secure + credentialed CORS on every request).

// Thrown when VITE_ANALYSIS_API_URL isn't set - the same "no backend
// deployed yet" state analyzeWithLLM.js handles, just for the accounts
// endpoints instead of /analyze. AuthContext treats this as "accounts
// aren't available," not a runtime error worth surfacing to the user.
export class AuthNotConfiguredError extends Error {}

const API_URL = import.meta.env.VITE_ANALYSIS_API_URL

function requireApiUrl() {
  if (!API_URL) throw new AuthNotConfiguredError('VITE_ANALYSIS_API_URL is not configured.')
  return API_URL
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${requireApiUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }
  return data
}

export function signup({ email, password, fullName }) {
  return request('/auth/signup', { method: 'POST', body: { email, password, fullName } })
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password } })
}

export function logout(token) {
  return request('/auth/logout', { method: 'POST', token })
}

export function fetchMe(token) {
  return request('/me', { token })
}

export function saveAnalysisRemote(token, analysis) {
  return request('/analyses', { method: 'POST', token, body: { analysis } })
}

export function listAnalysesRemote(token) {
  return request('/analyses', { token })
}

export function getAnalysisRemote(token, id) {
  return request(`/analyses/${id}`, { token })
}

export function deleteAnalysisRemote(token, id) {
  return request(`/analyses/${id}`, { method: 'DELETE', token })
}
