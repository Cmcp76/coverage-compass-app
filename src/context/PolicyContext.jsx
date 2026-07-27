import { createContext, useContext, useState } from 'react'
import { samplePolicy } from '../data/mockData.js'

// Shape the default sample policy to match what analyzeText() produces, so
// every downstream screen can read from one consistent shape whether or not
// the person has actually uploaded a file yet.
const defaultAnalysis = {
  fileName: 'sample auto policy (demo data)',
  analyzedAt: samplePolicy.reportGeneratedDate,
  hasRealText: false,
  detectedPolicyType: 'Personal / Commercial Auto (sample)',
  coverageScore: samplePolicy.coverageScore,
  coverages: samplePolicy.coverages,
  gaps: samplePolicy.gaps.map((g) => ({ ...g, found: g.status === 'Worth Confirming' })),
  scoreCategories: samplePolicy.scoreCategories,
  questionsToAsk: samplePolicy.questionsToAsk,
  strengths: samplePolicy.strengths,
}

const PolicyContext = createContext({
  analysis: defaultAnalysis,
  setAnalysis: () => {},
  reset: () => {},
})

export function PolicyProvider({ children }) {
  const [analysis, setAnalysis] = useState(defaultAnalysis)

  function reset() {
    setAnalysis(defaultAnalysis)
  }

  return (
    <PolicyContext.Provider value={{ analysis, setAnalysis, reset }}>
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicy() {
  return useContext(PolicyContext)
}
