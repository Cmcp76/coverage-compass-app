import { usePolicy } from '../context/PolicyContext.jsx'

// Shown on every page that reads the shared "active" analysis
// (Dashboard, AIReview, CoverageScore, GapReport) when that analysis came
// from browsing an older report in Reports.jsx rather than your most recent
// upload, since that swap is otherwise silent, sticky across pages, and
// persists across a reload with no way back except re-uploading.
export default function OlderReportBanner() {
  const { isViewingOlderReport, returnToLatest } = usePolicy()

  if (!isViewingOlderReport) return null

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-compass-amber bg-compass-amberlight px-4 py-3 text-sm text-compass-ink print:hidden">
      <p>You're viewing an older report. This is what's shown across your Dashboard until you switch back.</p>
      <button type="button" onClick={returnToLatest} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
        Return to My Latest Upload
      </button>
    </div>
  )
}
