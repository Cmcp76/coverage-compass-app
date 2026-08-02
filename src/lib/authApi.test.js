import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Same reasoning as analyzeWithLLM.test.js: import.meta.env is read once
// at module load, so each scenario needs vi.resetModules() + a fresh
// dynamic import rather than one shared top-level import.
describe('authApi', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it('throws AuthNotConfiguredError when VITE_ANALYSIS_API_URL is unset', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', '')
    const { signup, AuthNotConfiguredError } = await import('./authApi.js')
    await expect(signup({ email: 'a@b.com', password: 'x' })).rejects.toBeInstanceOf(AuthNotConfiguredError)
  })

  it('signup posts to /auth/signup with the expected body', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 't', user: { id: 'u1' } }) })
    const { signup } = await import('./authApi.js')
    const result = await signup({ email: 'a@b.com', password: 'x', fullName: 'A' })
    expect(result).toEqual({ token: 't', user: { id: 'u1' } })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://worker.example.com/auth/signup',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'x', fullName: 'A' }),
      }),
    )
  })

  it('login posts to /auth/login', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 't', user: {} }) })
    const { login } = await import('./authApi.js')
    await login({ email: 'a@b.com', password: 'x' })
    expect(global.fetch).toHaveBeenCalledWith('https://worker.example.com/auth/login', expect.objectContaining({ method: 'POST' }))
  })

  it('sends an Authorization header for authenticated calls', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: {} }) })
    const { fetchMe } = await import('./authApi.js')
    await fetchMe('sometoken')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://worker.example.com/me',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer sometoken' }) }),
    )
  })

  it('throws with the server-provided error message on a non-OK response', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Incorrect email or password.' }) })
    const { login } = await import('./authApi.js')
    await expect(login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow('Incorrect email or password.')
  })

  it('saveAnalysisRemote wraps the analysis object in the expected body shape', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'a1' }) })
    const { saveAnalysisRemote } = await import('./authApi.js')
    await saveAnalysisRemote('token', { coverageScore: 80 })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://worker.example.com/analyses',
      expect.objectContaining({ body: JSON.stringify({ analysis: { coverageScore: 80 } }) }),
    )
  })

  it('deleteAnalysisRemote issues a DELETE to /analyses/:id', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    const { deleteAnalysisRemote } = await import('./authApi.js')
    await deleteAnalysisRemote('token', 'a1')
    expect(global.fetch).toHaveBeenCalledWith('https://worker.example.com/analyses/a1', expect.objectContaining({ method: 'DELETE' }))
  })
})
