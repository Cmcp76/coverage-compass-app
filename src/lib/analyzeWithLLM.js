// Calls the Coverage Compass analysis Worker (see /worker) for a real,
// LLM-based reading of the uploaded policy text. Upload.jsx tries this
// first and falls back to the local keyword-matching engine
// (policyAnalysis.js) if it fails, so the app still works end-to-end with
// no backend deployed or reachable.

// Thrown when VITE_ANALYSIS_API_URL simply isn't set - this is the expected
// state for anyone running the app without having deployed the worker yet
// (including this repo's current GitHub Pages deploy), not a runtime
// failure. Upload.jsx treats this case silently; every other failure here
// is a genuine "something went wrong" worth telling the person about.
export class AnalysisNotConfiguredError extends Error {}

const API_URL = import.meta.env.VITE_ANALYSIS_API_URL

// Real analysis takes a while (a full policy is a lot of text for a model
// to read carefully) - long enough to need an explicit timeout so a
// slow/stalled request doesn't leave someone staring at "Reviewing your
// policy..." indefinitely, short enough that falling back to the local
// engine still feels like a reasonable wait rather than a second failure.
const TIMEOUT_MS = 45000

export async function analyzeWithLLM(text, meta = {}) {
  if (!API_URL) {
    throw new AnalysisNotConfiguredError('VITE_ANALYSIS_API_URL is not configured.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fileName: meta.fileName, truncated: Boolean(meta.truncated) }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || `Analysis service returned ${response.status}`)
    }

    const { analysis } = await response.json()
    if (!analysis) throw new Error('Analysis service returned no result.')
    return analysis
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Analysis service timed out.')
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
