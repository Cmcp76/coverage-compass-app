import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'
import { usePolicy } from '../context/PolicyContext.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'
import OlderReportBanner from '../components/OlderReportBanner.jsx'
import NoReadableTextBanner from '../components/NoReadableTextBanner.jsx'
import TruncatedDocumentBanner from '../components/TruncatedDocumentBanner.jsx'
import FallbackAnalysisBanner from '../components/FallbackAnalysisBanner.jsx'

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

// Maps analyzeText()'s literal English category names to the translated label.
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
  const { lang } = useParams()

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

      <div className="mt-3 space-y-3">
        {analysis.scoreCategories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-start gap-4 rounded-lg border border-compass-line bg-compass-surface p-4"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                cat.status === 'good' ? 'bg-compass-mint text-compass-green' : 'bg-compass-amberlight text-compass-amber'
              }`}
              aria-hidden="true"
            >
              {cat.status === 'good' ? '✓' : '!'}
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-compass-ink">
                {CATEGORY_KEYS[cat.name] ? t(CATEGORY_KEYS[cat.name]) : cat.name}
                <span className={cat.status === 'good' ? 'tag-good' : 'tag-review'}>
                  {cat.status === 'good' ? 'Good' : 'Worth a look'}
                </span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-compass-slate">
                {categoryDetails[cat.name]}
              </p>
            </div>
          </div>
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
