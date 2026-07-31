import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'
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
import { useTheme } from '../context/ThemeContext.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'
import OlderReportBanner from '../components/OlderReportBanner.jsx'
import NoReadableTextBanner from '../components/NoReadableTextBanner.jsx'
import TruncatedDocumentBanner from '../components/TruncatedDocumentBanner.jsx'
import FallbackAnalysisBanner from '../components/FallbackAnalysisBanner.jsx'
import { getChartColors } from '../lib/chartTheme.js'

const categoryDetails = {
  'Liability Protection':
    'Looks at whether your liability limits fall within commonly recommended ranges for your situation.',
  'Property Protection':
    'Looks at whether the property or physical damage coverage typical for this kind of policy is present.',
  Deductibles:
    'Looks at whether your deductible levels are clearly stated and reasonable relative to your coverage.',
  'Optional Coverages':
    'Looks at whether commonly valuable optional coverages for this kind of policy are present.',
  'Risk Areas':
    'Flags missing information, unclear exclusions, or areas the document did not provide enough detail to evaluate.',
}

// Maps analyzeText()'s literal English category names to the translated
// label. The bar chart's shortened y-axis tick labels (further down) are
// left in English regardless of language — the translation file only has
// full-length category names, and the chart's own label-shortening logic
// (stripping " Protection"/" Coverages") is written against those specific
// English suffixes, so it can't correctly shorten a translated label either.
const CATEGORY_KEYS = {
  'Liability Protection': 'score.categories.liability',
  'Property Protection': 'score.categories.property',
  Deductibles: 'score.categories.deductibles',
  'Optional Coverages': 'score.categories.optional',
  'Risk Areas': 'score.categories.risk',
}

export default function CoverageScore() {
  const { t } = useTranslation('common')
  const { analysis } = usePolicy()
  const { theme } = useTheme()
  const { lang } = useParams()
  const chartColors = getChartColors(theme)
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const chartData = analysis.scoreCategories.map((cat) => ({
    name: cat.name.replace(' Protection', '').replace(' Coverages', ''),
    value: cat.status === 'good' ? 90 : 60,
    status: cat.status,
  }))

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <OlderReportBanner />
      <NoReadableTextBanner />
      <TruncatedDocumentBanner />
      <FallbackAnalysisBanner />
      <h1 className="text-center font-display text-xl font-semibold text-compass-heading">
        {t('score.title')}
      </h1>

      <div className="mt-6 rounded-2xl bg-compass-skyblue p-10 text-center">
        <div className="flex justify-center">
          <ScoreGauge score={analysis.coverageScore} size={188} strokeWidth={14}>
            {(animated) => (
              <p className="font-display text-5xl font-semibold text-compass-link">
                {animated}
                <span className="text-lg text-compass-slate">/100</span>
              </p>
            )}
          </ScoreGauge>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-compass-ink">
          {t('score.shortExplainer')}
        </p>
      </div>

      <p className="mt-8 text-sm font-medium text-compass-ink">How your score breaks down</p>

      <div className="mt-3 h-52 rounded-lg border border-compass-line bg-compass-surface p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: chartColors.tick }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, _name, item) => [
                item.payload.status === 'good' ? 'Good' : 'Worth a look',
                'Status',
              ]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                backgroundColor: chartColors.tooltipBg,
                borderColor: chartColors.tooltipBorder,
                color: chartColors.tooltipText,
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={!reduceMotion}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.status === 'good' ? chartColors.good : chartColors.review}
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
          <details key={cat.name} className="rounded-lg border border-compass-line bg-compass-surface p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between marker:content-none">
              <span className="text-sm text-compass-ink">
                {CATEGORY_KEYS[cat.name] ? t(CATEGORY_KEYS[cat.name]) : cat.name}
              </span>
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

      <Link to={localePath(lang, '/gap-report')} className="btn-primary mt-8 flex w-full justify-center">
        {t('buttons.seeFullReport')}
      </Link>

      <p className="disclaimer mt-6">
        Coverage Compass generates this score by analyzing the document you
        uploaded. It is for educational purposes only and does not constitute
        insurance, legal, or financial advice. Only a licensed insurance professional
        can evaluate whether your coverage is adequate for your specific needs.
      </p>
    </div>
  )
}
