import { Link } from 'react-router-dom'
import { recentActivity } from '../data/mockData.js'
import { usePolicy } from '../context/PolicyContext.jsx'

export default function Dashboard() {
  const { analysis } = usePolicy()
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-compass-navy">
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score card */}
        <Link to="/score" className="card flex flex-col items-center justify-center text-center transition hover:border-compass-blue">
          <p className="text-sm text-compass-slate">Your Coverage Score</p>
          <p className="mt-2 font-display text-5xl font-semibold text-compass-blue">
            {analysis.coverageScore}
            <span className="text-xl text-compass-slate">/100</span>
          </p>
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
            {recentActivity.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-lg border border-compass-line px-4 py-3"
              >
                <div>
                  <p className="text-sm text-compass-ink">{item.title}</p>
                  <p className="text-xs text-compass-slate">{item.date}</p>
                </div>
                {item.type === 'review' && (
                  <Link to="/gap-report" className="btn-secondary px-3 py-1.5 text-xs">
                    View Report
                  </Link>
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
            <li>
              <Link to="/learning-center" className="text-compass-blue hover:underline">
                Do You Need an Umbrella Policy?
              </Link>
            </li>
            <li>
              <Link to="/learning-center" className="text-compass-blue hover:underline">
                Renters Insurance 101
              </Link>
            </li>
            <li>
              <Link to="/tools" className="text-compass-blue hover:underline">
                Try the Deductible Calculator
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
