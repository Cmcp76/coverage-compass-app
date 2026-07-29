import { Link, useNavigate } from 'react-router-dom'
import { recentActivity } from '../data/mockData.js'
import { usePolicy } from '../context/PolicyContext.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'

export default function Dashboard() {
  const { analysis, history, loadFromHistory } = usePolicy()
  const navigate = useNavigate()

  const latestReview = history[0]
    ? {
        title: `${history[0].detectedPolicyType} reviewed`,
        date: history[0].analyzedAt,
        onView: () => {
          loadFromHistory(history[0].id)
          navigate('/gap-report')
        },
      }
    : {
        title: 'Sample auto policy reviewed (demo data)',
        date: 'Upload your own to replace this',
        onView: () => navigate('/gap-report'),
      }
  const activityFeed = [latestReview, ...recentActivity.slice(1)]

  const topGaps = analysis.gaps.filter((g) => !g.found).slice(0, 2)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-compass-heading">
            Hi, Maria
          </h1>
          <p className="mt-1 text-sm text-compass-slate">
            Here's where things stand today.
          </p>
        </div>
        <Link to="/upload" className="btn-primary">
          Upload Policy
        </Link>
      </div>

      <Link
        to="/trucking-startup"
        className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-compass-line bg-compass-paper px-5 py-4 transition hover:border-compass-blue"
      >
        <div>
          <span className="tag-neutral">Trucking</span>
          <p className="mt-2 text-sm font-medium text-compass-ink">Starting a trucking company?</p>
          <p className="mt-1 text-xs text-compass-slate">
            A step-by-step checklist for business formation, FMCSA authority, driver and
            vehicle compliance, and the insurance coverage that matches your operation. No
            policy upload needed.
          </p>
        </div>
        <span className="btn-secondary shrink-0">Start My Trucking Company</span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score card */}
        <Link to="/score" className="card flex flex-col items-center justify-center text-center transition hover:border-compass-blue">
          <p className="text-sm text-compass-slate">Your Coverage Score</p>
          <ScoreGauge score={analysis.coverageScore} size={140} strokeWidth={10}>
            {(animated) => (
              <p className="font-display text-3xl font-semibold text-compass-link">
                {animated}
                <span className="text-sm text-compass-slate">/100</span>
              </p>
            )}
          </ScoreGauge>
          <p className="mt-2 text-xs text-compass-slate">
            Educational snapshot, not a guarantee
          </p>
        </Link>

        {/* Category quick view */}
        <div className="card lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-compass-ink">
            Coverage checklist
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {analysis.scoreCategories.map((cat) => (
              <div key={cat.name} className="rounded-lg bg-compass-paper p-3">
                <p className="text-xs text-compass-slate">{cat.name}</p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    cat.status === 'good' ? 'text-compass-green' : 'text-compass-amber'
                  }`}
                >
                  {cat.status === 'good' ? 'Good' : 'Worth a look'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="card lg:col-span-2">
          <p className="mb-4 text-sm font-medium text-compass-ink">Recent activity</p>
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-lg border border-compass-line px-4 py-3 transition hover:border-compass-blue/40 hover:bg-compass-paper"
              >
                <div>
                  <p className="text-sm text-compass-ink">{item.title}</p>
                  <p className="text-xs text-compass-slate">{item.date}</p>
                </div>
                {item.onView && (
                  <button onClick={item.onView} className="btn-secondary px-3 py-1.5 text-xs">
                    View Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress / recommendations */}
        <div className="card">
          <p className="mb-4 text-sm font-medium text-compass-ink">
            Educational recommendations
          </p>
          <ul className="space-y-3 text-sm text-compass-slate">
            {topGaps.map((gap) => (
              <li key={gap.name}>
                <Link to="/gap-report" className="text-compass-link hover:underline">
                  Would {gap.name.toLowerCase()} make sense for you?
                </Link>
              </li>
            ))}
            <li>
              <Link to="/tools" className="text-compass-link hover:underline">
                Try the Deductible Calculator
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
