import { usePolicy } from '../context/PolicyContext.jsx'

// Shown on every page that reads the shared "active" analysis (AIReview,
// CoverageScore, GapReport, Report) when the uploaded PDF had more pages
// than pdfText.js's MAX_PAGES cap. Anything past that page was never read,
// so a coverage that only appears later in the document reads as "missing"
// with no indication the rest of the file was silently dropped.
export default function TruncatedDocumentBanner() {
  const { analysis } = usePolicy()

  if (analysis.isDemo || !analysis.truncated) return null

  return (
    <div className="mb-6 rounded-lg border border-compass-line bg-compass-paper px-4 py-3 text-xs text-compass-slate print:hidden">
      This document is longer than this prototype can review, only the first 20
      pages were read. Anything further in, like an endorsement or schedule on a
      later page, may show as missing here even if it's actually in your policy.
    </div>
  )
}
