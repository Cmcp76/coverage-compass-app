import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { usePolicy } from '../context/PolicyContext.jsx'

export default function Reports() {
  const { history, loadFromHistory, removeFromHistory } = usePolicy()
  const navigate = useNavigate()

  function openReport(id, path) {
    loadFromHistory(id)
    navigate(path)
  }

  // Oldest-first so the chart reads left-to-right in the order you uploaded,
  // each bar labeled with policy type + date since these are separate
  // uploads, not repeated snapshots of the same policy.
  const chartData = [...history].reverse().map((r) => ({
    name: r.detectedPolicyType.replace(' / ', '/').replace(' (sample)', ''),
    date: r.analyzedAt,
    score: r.coverageScore,
  }))

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Your Reports
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Every policy review you've generated, in one place.
      </p>

      {history.length >= 2 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-compass-ink">Score history</p>
          <div
            className="mt-3 rounded-lg border border-compass-line bg-white p-3"
            style={{ height: Math.max(120, chartData.length * 44) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E3E8EF" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 12, fill: '#5B6675' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, _name, item) => [`${value}/100`, item.payload.date]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E3E8EF' }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name + entry.date}
                      fill={entry.score >= 80 ? '#177C5B' : '#965E13'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
