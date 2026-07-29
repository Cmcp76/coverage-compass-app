import { createContext, useContext, useState } from 'react'
import { samplePolicy } from '../data/mockData.js'

// Shape the default sample policy to match what analyzeText() produces, so
// every downstream screen can read from one consistent shape whether or not
// the person has actually uploaded a file yet.
const defaultAnalysis = {
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

const HISTORY_KEY = 'coverage-compass-report-history'
const ANALYSIS_KEY = 'coverage-compass-current-analysis'
const MAX_HISTORY = 10

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable (e.g. private browsing), history just
    // won't persist across reloads, the app still works this session.
  }
}

function loadAnalysis() {
  try {
    const raw = localStorage.getItem(ANALYSIS_KEY)
    const parsed = raw ? JSON.parse(raw) : defaultAnalysis
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : defaultAnalysis
  } catch {
    return defaultAnalysis
  }
}

function saveAnalysis(analysis) {
  try {
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis))
  } catch {
    // Storage full or unavailable, current analysis just won't survive a
    // reload, the app still works this session.
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
})

export function PolicyProvider({ children }) {
  const [analysis, setAnalysisState] = useState(loadAnalysis)
  const [history, setHistory] = useState(loadHistory)

  function setAnalysis(newAnalysis) {
    setAnalysisState(newAnalysis)
    saveAnalysis(newAnalysis)
  }

  function reset() {
    setAnalysisState(defaultAnalysis)
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
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY)
      saveHistory(next)
      return next
    })
  }

  function loadFromHistory(id) {
    const entry = history.find((h) => h.id === id)
    if (entry) setAnalysis(entry.analysis)
  }

  function removeFromHistory(id) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id)
      saveHistory(next)
      return next
    })
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
      }}
    >
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicy() {
  return useContext(PolicyContext)
}
