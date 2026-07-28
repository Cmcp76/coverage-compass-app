import { Link } from 'react-router-dom'
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
import ScoreGauge from '../components/ScoreGauge.jsx'

const categoryDetails = {
  'Liability Protection':
    'Looks at whether your liability limits fall within commonly recommended ranges for your situation.',
  'Property Protection':
    'Looks at whether your dwelling, structures, or business property coverage aligns with what is typically needed.',
  Deductibles:
    'Looks at whether your deductible levels are clearly stated and reasonable relative to your coverage.',
  'Optional Coverages':
    'Looks at whether commonly valuable add-ons (umbrella, rental reimbursement, roadside) are present.',
  'Risk Areas':
    'Flags missing information, unclear exclusions, or areas the document did not provide enough detail to evaluate.',
}

export default function CoverageScore() {
  const { analysis } = usePolicy()

  const chartData = analysis.scoreCategories.map((cat) => ({
    name: cat.name.replace(' Protection', '').replace(' Coverages', ''),
    value: cat.status === 'good' ? 90 : 60,
    status: cat.status,
  }))

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-center font-display text-xl font-semibold text-compass-navy">
        Your Coverage Score
      </h1>

      <div className="mt-6 rounded-2xl bg-compass-skyblue p-10 text-center">
        <div className="flex justify-center">
          <ScoreGauge score={analysis.coverageScore} size={188} strokeWidth={14}>
            {(animated) => (
              <p className="font-display text-5xl font-semibold text-compass-blue">
                {animated}
                <span className="text-lg text-compass-slate">/100</span>
              </p>
            )}
          </ScoreGauge>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-compass-ink">
          Your Coverage Score is an educational snapshot of how your policy compares
          across key protection areas, not a rating of you, and not a guarantee of how
          a claim would be handled.
        </p>
      </div>

      <p className="mt-8 text-sm font-medium text-compass-ink">How your score breaks down</p>

      <div className="mt-3 h-52 rounded-lg border border-compass-line bg-white p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E3E8EF" />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: '#5B6675' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => [
                item.payload.status === 'good' ? 'Good' : 'Worth a look',
                'Status',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E3E8EF' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.status === 'good' ? '#177C5B' : '#965E13'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-compass-slate">
        Illustrative only, a visual read of where your policy looks solid vs. worth a
        second look, not a precise sub-score.
      </p>

      <div className="mt-4 space-y-3">
        {analysis.scoreCategories.map((cat) => (
          <details key={cat.name} className="rounded-lg border border-compass-line bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between marker:content-none">
              <span className="text-sm text-compass-ink">{cat.name}</span>
              <span className={cat.status === 'good' ? 'tag-good' : 'tag-review'}>
                {cat.status === 'good' ? 'Good' : 'Worth a look'}
              </span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-compass-slate">
              {categoryDetails[cat.name]}
            </p>
          </details>
        ))}
      </div>

      <Link to="/gap-report" className="btn-primary mt-8 flex w-full justify-center">
        See Full Report
      </Link>

      <p className="disclaimer mt-6">
        Coverage Compass generates this score using AI analysis of the document you
        uploaded. It is for educational purposes only and does not constitute
        insurance, legal, or financial advice. Only a licensed insurance professional
        can evaluate whether your coverage is adequate for your specific needs.
      </p>
    </div>
  )
}
