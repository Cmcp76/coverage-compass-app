import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// import.meta.env.VITE_ANALYSIS_API_URL is read once at module load, so
// each "not configured" vs "configured" scenario needs its own fresh
// module instance via vi.resetModules() + dynamic import rather than one
// shared top-level import.
describe('analyzeWithLLM', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it('throws AnalysisNotConfiguredError when VITE_ANALYSIS_API_URL is unset', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', '')
    const { analyzeWithLLM, AnalysisNotConfiguredError } = await import('./analyzeWithLLM.js')
    await expect(analyzeWithLLM('some text')).rejects.toBeInstanceOf(AnalysisNotConfiguredError)
  })

  it('returns the analysis object on a successful response', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    const fakeAnalysis = { detectedPolicyType: 'Personal / Commercial Auto', coverageScore: 80 }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ analysis: fakeAnalysis }),
    })
    const { analyzeWithLLM } = await import('./analyzeWithLLM.js')
    const result = await analyzeWithLLM('some text', { fileName: 'a.pdf' })
    expect(result).toEqual(fakeAnalysis)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://worker.example.com/analyze',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('throws with the server-provided error message on a non-OK response', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Analysis service returned an error (502).' }),
    })
    const { analyzeWithLLM } = await import('./analyzeWithLLM.js')
    await expect(analyzeWithLLM('some text')).rejects.toThrow('Analysis service returned an error (502).')
  })

  it('throws when the response has no analysis field', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    const { analyzeWithLLM } = await import('./analyzeWithLLM.js')
    await expect(analyzeWithLLM('some text')).rejects.toThrow('Analysis service returned no result.')
  })

  it('throws a timeout-specific message when the request is aborted', async () => {
    vi.stubEnv('VITE_ANALYSIS_API_URL', 'https://worker.example.com')
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted.')
      err.name = 'AbortError'
      return Promise.reject(err)
    })
    const { analyzeWithLLM } = await import('./analyzeWithLLM.js')
    await expect(analyzeWithLLM('some text')).rejects.toThrow('Analysis service timed out.')
  })
})
