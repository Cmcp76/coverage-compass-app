import { createContext, useContext, useState } from 'react'
import { samplePolicy } from '../data/mockData.js'

// Shape the default sample policy to match what analyzeText() produces, so
// every downstream screen can read from one consistent shape whether or not
// the person has actually uploaded a file yet.
export const defaultAnalysis = {
  fileName: 'sample auto policy (demo data)',
  analyzedAt: samplePolicy.reportGeneratedDate,
  hasRealText: false,
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
  const [analysis, setAnalysisState] = useState(loadAnalysis)
  const [history, setHistory] = useState(loadHistory)
  // Tracks which history entry (if any) is the source of the active
  // analysis. Browsing to an older report from Reports.jsx/Dashboard used to
  // silently and permanently replace the "current" analysis everywhere
  // (Dashboard's score gauge, AIReview, Score, GapReport), with no way back
  // except re-uploading. This lets those pages tell the difference and offer
  // a way back to the most recent upload.
  const [activeHistoryId, setActiveHistoryIdState] = useState(loadActiveHistoryId)

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

  function addToHistory(newAnalysis) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: newAnalysis.fileName,
      detectedPolicyType: newAnalysis.detectedPolicyType,
      analyzedAt: newAnalysis.analyzedAt,
      coverageScore: newAnalysis.coverageScore,
      analysis: newAnalysis,
    }
    setActiveHistoryId(null) // a fresh upload is always the new latest, not a historical view
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }

  function loadFromHistory(id) {
    const entry = history.find((h) => h.id === id)
    if (entry) {
      setAnalysis(entry.analysis)
      setActiveHistoryId(id)
    }
  }

  function removeFromHistory(id) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id)
      saveHistory(next)
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
