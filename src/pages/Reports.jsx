import { Link, useNavigate } from 'react-router-dom'
import { usePolicy } from '../context/PolicyContext.jsx'

export default function Reports() {
  const { history, loadFromHistory, removeFromHistory } = usePolicy()
  const navigate = useNavigate()

  function openReport(id, path) {
    loadFromHistory(id)
    navigate(path)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Your Reports
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Every policy review you've generated, in one place.
      </p>

      {history.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-compass-line p-10 text-center">
          <p className="text-sm font-medium text-compass-ink">No reports yet</p>
          <p className="mt-1 text-sm text-compass-slate">
            Upload a policy to get your first Coverage Score and report.
          </p>
          <Link to="/upload" className="btn-primary mt-5 inline-flex">
            Upload Your Policy
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {history.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-compass-line bg-white px-5 py-4 transition hover:shadow-card"
            >
              <div>
                <p className="text-sm font-medium text-compass-ink">
                  {r.detectedPolicyType}
                </p>
                <p className="text-xs text-compass-slate">
                  {r.fileName} &middot; {r.analyzedAt} &middot; Score {r.coverageScore}/100
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReport(r.id, '/gap-report')}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  View
                </button>
                <button
                  onClick={() => openReport(r.id, '/report')}
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  Download
                </button>
                <button
                  onClick={() => removeFromHistory(r.id)}
                  className="px-2 py-1.5 text-xs text-compass-slate hover:text-compass-amber"
                  aria-label={`Remove ${r.detectedPolicyType} report`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
