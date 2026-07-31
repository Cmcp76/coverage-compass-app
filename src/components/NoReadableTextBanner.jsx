import { usePolicy } from '../context/PolicyContext.jsx'

// Shown on every page that reads the shared "active" analysis (AIReview,
// CoverageScore, GapReport) when the uploaded document had no extractable
// text (a photo or scanned image with no text layer), so every coverage
// below reads "NEEDED INFORMATION" not because the policy lacks it, but
// because nothing could be read from the file. Without this, a scanned
// upload looks identical to a real, completed review with a low score.
// Reports.jsx's "View" link goes straight to /gap-report, bypassing
// AIReview entirely, so this can't just live on that one page.
export default function NoReadableTextBanner() {
  const { analysis } = usePolicy()

  if (analysis.isDemo || analysis.hasRealText) return null

  return (
    <div className="mb-6 rounded-lg border border-compass-line bg-compass-paper px-4 py-3 text-xs text-compass-slate print:hidden">
      No readable text was found in this document (common with photos or scanned
      images), so nothing below could be confirmed, everything is labeled NEEDED
      INFORMATION. Upload a text-based PDF or .txt file for a review based on your
      actual policy.
    </div>
  )
}
