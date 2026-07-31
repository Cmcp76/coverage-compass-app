import { usePolicy } from '../context/PolicyContext.jsx'

// Shown on every page that reads the shared "active" analysis (AIReview,
// CoverageScore, GapReport, Report) when this specific review came from the
// local keyword-matching engine instead of real AI analysis - either
// because AI-powered analysis isn't configured for this deployment, or a
// request to it failed. Either way, a person who's told this product does
// "AI-powered analysis" deserves to know when a given review didn't
// actually get that, since the two engines have meaningfully different
// accuracy (see src/lib/policyAnalysis.js vs worker/src/mapAnalysis.js).
export default function FallbackAnalysisBanner() {
  const { analysis } = usePolicy()

  if (analysis.isDemo || analysis.analysisSource !== 'fallback') return null

  return (
    <div className="mb-6 rounded-lg border border-compass-line bg-compass-paper px-4 py-3 text-xs text-compass-slate print:hidden">
      This review used Coverage Compass's local pattern-matching fallback, not
      AI-powered analysis - AI analysis wasn't available when you uploaded this
      document. It's a more basic keyword search and may miss things a full
      reading of your document would catch.
    </div>
  )
}
