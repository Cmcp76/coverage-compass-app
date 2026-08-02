import { createContext, useContext, useEffect, useState } from 'react'
import { samplePolicy } from '../data/mockData.js'
import { useAuth } from './AuthContext.jsx'
import { saveAnalysisRemote, listAnalysesRemote, getAnalysisRemote, deleteAnalysisRemote } from '../lib/authApi.js'

// Shape the default sample policy to match what analyzeText() produces, so
// every downstream screen can read from one consistent shape whether or not
// the person has actually uploaded a file yet.
export const defaultAnalysis = {
  fileName: 'sample auto policy (demo data)',
  analyzedAt: samplePolicy.reportGeneratedDate,
  hasRealText: false,
  truncated: false,
  isDemo: true,
  namedInsured: samplePolicy.customerFullName,
  detectedPolicyType: 'Personal / Commercial Auto (sample)',
  coverageScore: samplePolicy.coverageScore,
  coverages: samplePolicy.coverages,
  gaps: samplePolicy.gaps.map((g) => ({ ...g, found: g.status === 'Worth Confirming' })),
  scoreCategories: samplePolicy.scoreCategories,
  questionsToAsk: samplePolicy.questionsToAsk,
  strengths: samplePolicy.strengths,
}

export const HISTORY_KEY = 'coverage-compass-report-history'
export const ANALYSIS_KEY = 'coverage-compass-current-analysis'
export const ACTIVE_HISTORY_ID_KEY = 'coverage-compass-active-history-id'
const MAX_HISTORY = 10

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    // Reports.jsx reads detectedPolicyType unconditionally on every entry
    // (e.g. r.detectedPolicyType.replace(...)) to build its chart, so a
    // malformed entry here would crash that page rather than degrade
    // gracefully the way this loader's try/catch is meant to.
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        typeof entry.detectedPolicyType === 'string' &&
        entry.analysis &&
        typeof entry.analysis === 'object',
    )
  } catch {
    return []
  }
}

export function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable (e.g. private browsing), history just
    // won't persist across reloads, the app still works this session.
  }
}

export function loadAnalysis() {
  try {
    const raw = localStorage.getItem(ANALYSIS_KEY)
    const parsed = raw ? JSON.parse(raw) : defaultAnalysis
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : defaultAnalysis
  } catch {
    return defaultAnalysis
  }
}

export function saveAnalysis(analysis) {
  try {
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis))
  } catch {
    // Storage full or unavailable, current analysis just won't survive a
    // reload, the app still works this session.
  }
}

export function loadActiveHistoryId() {
  try {
    const raw = localStorage.getItem(ACTIVE_HISTORY_ID_KEY)
    return typeof raw === 'string' && raw ? raw : null
  } catch {
    return null
  }
}

export function saveActiveHistoryId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_HISTORY_ID_KEY, id)
    else localStorage.removeItem(ACTIVE_HISTORY_ID_KEY)
  } catch {
    // Storage full or unavailable, the "viewing an older report" banner just
    // won't survive a reload, the app still works this session.
  }
}

function buildHistoryEntry(id, newAnalysis) {
  return {
    id,
    fileName: newAnalysis.fileName,
    detectedPolicyType: newAnalysis.detectedPolicyType,
    analyzedAt: newAnalysis.analyzedAt,
    coverageScore: newAnalysis.coverageScore,
    analysis: newAnalysis,
  }
}

const PolicyContext = createContext({
  analysis: defaultAnalysis,
  setAnalysis: () => {},
  reset: () => {},
  history: [],
  addToHistory: () => {},
  loadFromHistory: () => {},
  removeFromHistory: () => {},
  isViewingOlderReport: false,
  returnToLatest: () => {},
})

export function PolicyProvider({ children }) {
  const { token } = useAuth()
  const [analysis, setAnalysisState] = useState(loadAnalysis)
  const [history, setHistory] = useState(loadHistory)
  // Tracks which history entry (if any) is the source of the active
  // analysis. Browsing to an older report from Reports.jsx/Dashboard used to
  // silently and permanently replace the "current" analysis everywhere
  // (Dashboard's score gauge, AIReview, Score, GapReport), with no way back
  // except re-uploading. This lets those pages tell the difference and offer
  // a way back to the most recent upload.
  const [activeHistoryId, setActiveHistoryIdState] = useState(loadActiveHistoryId)

  // History has exactly one source of truth at a time: this browser's
  // local storage for a guest, or the signed-in account's saved reviews on
  // the server - never a mix, so switching between logged-in/logged-out
  // cleanly switches which one is authoritative instead of merging two
  // lists with potentially different ids for the same upload.
  useEffect(() => {
    if (!token) {
      setHistory(loadHistory())
      return
    }
    let cancelled = false
    listAnalysesRemote(token)
      .then(({ analyses }) => {
        if (cancelled) return
        // The list endpoint only returns metadata (no full analysis blob,
        // to avoid shipping every saved review's full payload just to
        // render a list) - loadFromHistory fetches the full blob on demand
        // when one of these is actually opened.
        setHistory(analyses.map((a) => ({ ...a, analysis: null })))
      })
      .catch(() => {
        // Couldn't load remote history (network hiccup, or no backend
        // deployed) - fall back to local rather than showing nothing.
        if (!cancelled) setHistory(loadHistory())
      })
    return () => {
      cancelled = true
    }
  }, [token])

  function setActiveHistoryId(id) {
    setActiveHistoryIdState(id)
    saveActiveHistoryId(id)
  }

  function setAnalysis(newAnalysis) {
    setAnalysisState(newAnalysis)
    saveAnalysis(newAnalysis)
  }

  function reset() {
    setAnalysisState(defaultAnalysis)
    setActiveHistoryId(null)
    try {
      localStorage.removeItem(ANALYSIS_KEY)
    } catch {
      // Storage unavailable, in-memory state is already reset above.
    }
  }

  async function addToHistory(newAnalysis) {
    setActiveHistoryId(null) // a fresh upload is always the new latest, not a historical view

    if (token) {
      try {
        const { id } = await saveAnalysisRemote(token, newAnalysis)
        setHistory((prev) => [buildHistoryEntry(id, newAnalysis), ...prev].slice(0, MAX_HISTORY))
        return
      } catch (err) {
        // The review itself already succeeded and is showing on screen -
        // only the "save it to your account" part failed. Fall through to
        // a local-only entry so this upload isn't lost from the session's
        // history just because that one request failed, rather than
        // silently losing the record.
        console.error('Could not save this review to your account, keeping it for this session only:', err)
      }
    }

    const entry = buildHistoryEntry(`${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, newAnalysis)
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      if (!token) saveHistory(next) // guests persist locally; a failed remote save above is session-only on purpose
      return next
    })
  }

  async function loadFromHistory(id) {
    const entry = history.find((h) => h.id === id)
    if (!entry) return

    if (entry.analysis) {
      setAnalysis(entry.analysis)
      setActiveHistoryId(id)
      return
    }

    // Metadata-only entry (came from the server's list endpoint) - fetch
    // the full analysis on demand rather than loading every saved review's
    // full payload just to render the history list.
    if (!token) return
    try {
      const { analysis: fullAnalysis } = await getAnalysisRemote(token, id)
      setAnalysis(fullAnalysis)
      setActiveHistoryId(id)
    } catch (err) {
      console.error('Failed to load that saved review:', err)
    }
  }

  async function removeFromHistory(id) {
    if (token) {
      try {
        await deleteAnalysisRemote(token, id)
      } catch (err) {
        console.error('Failed to delete that saved review from your account:', err)
        return // leave it in the list rather than hiding a deletion that didn't actually happen server-side
      }
    }
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id)
      if (!token) saveHistory(next)
      return next
    })
    // Removing the entry currently being viewed used to leave
    // activeHistoryId pointing at a now-deleted id, stranding
    // isViewingOlderReport (and the "Return to Latest" banner it drives)
    // permanently true with no matching history[0] to return to.
    if (id === activeHistoryId) setActiveHistoryId(null)
  }

  const isViewingOlderReport = activeHistoryId != null && activeHistoryId !== history[0]?.id

  function returnToLatest() {
    if (history[0]) loadFromHistory(history[0].id)
  }

  return (
    <PolicyContext.Provider
      value={{
        analysis,
        setAnalysis,
        reset,
        history,
        addToHistory,
        loadFromHistory,
        removeFromHistory,
        isViewingOlderReport,
        returnToLatest,
      }}
    >
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicy() {
  return useContext(PolicyContext)
}
