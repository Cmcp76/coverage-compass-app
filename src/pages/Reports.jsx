import { Link } from 'react-router-dom'

const reports = [
  { id: 1, type: 'Auto Policy Review', date: 'Jul 22, 2026' },
  { id: 2, type: 'Homeowners Policy Review', date: 'Mar 3, 2026' },
]

// Flip to true to preview the empty state
const SHOW_EMPTY_STATE = false

export default function Reports() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Your Reports
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Every policy review you've generated, in one place.
      </p>

      {SHOW_EMPTY_STATE || reports.length === 0 ? (
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
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-compass-line bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-compass-ink">{r.type}</p>
                <p className="text-xs text-compass-slate">{r.date}</p>
              </div>
              <div className="flex gap-2">
                <Link to="/gap-report" className="btn-secondary px-3 py-1.5 text-xs">
                  View
                </Link>
                <Link to="/report" className="btn-primary px-3 py-1.5 text-xs">
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
