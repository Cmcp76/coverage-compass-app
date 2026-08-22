import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'
import { usePolicy } from '../context/PolicyContext.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'
import OlderReportBanner from '../components/OlderReportBanner.jsx'
import NoReadableTextBanner from '../components/NoReadableTextBanner.jsx'
import TruncatedDocumentBanner from '../components/TruncatedDocumentBanner.jsx'
import FallbackAnalysisBanner from '../components/FallbackAnalysisBanner.jsx'

// Maps analyzeText()'s literal English category names to the translated
// label and the key its tier reasons live under (score.tierReasons.<key>).
const CATEGORY_KEYS = {
  'Liability Protection': { label: 'score.categories.liability', reasonKey: 'liability' },
  'Property Protection': { label: 'score.categories.property', reasonKey: 'property' },
  Deductibles: { label: 'score.categories.deductibles', reasonKey: 'deductibles' },
  'Optional Coverages': { label: 'score.categories.optional', reasonKey: 'optional' },
  'Risk Areas': { label: 'score.categories.risk', reasonKey: 'risk' },
}

// 'good' (Strong) / 'review' (Review) / 'gap' (Potential Gap) - see
// computeScoreCategories() in policyDomainKnowledge.js. Deliberately never a
// fourth "bad"/"failing" state or the color red: even a Potential Gap is
// framed as "worth reviewing," not "you're uninsured."
const TIER_STYLES = {
  good: { tag: 'tag-good', badge: 'bg-compass-mint text-compass-green', icon: '✓' },
  review: { tag: 'tag-review', badge: 'bg-compass-amberlight text-compass-amber', icon: '?' },
  gap: { tag: 'tag-gap', badge: 'bg-compass-coraltint text-compass-coral', icon: '⚑' },
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

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['good', 'review', 'gap'].map((status) => {
          const count = analysis.scoreCategories.filter((c) => c.status === status).length
          if (count === 0) return null
          return (
            <span key={status} className={TIER_STYLES[status].tag}>
              {count} {t(`score.tierLabels.${status}`)}
            </span>
          )
        })}
      </div>

      <p className="mt-8 text-sm font-medium text-compass-ink">How your score breaks down</p>

      <div className="mt-3 space-y-3">
        {analysis.scoreCategories.map((cat) => {
          const meta = CATEGORY_KEYS[cat.name]
          const style = TIER_STYLES[cat.status] || TIER_STYLES.review
          const label = meta ? t(meta.label) : cat.name
          const reason = meta ? t(`score.tierReasons.${meta.reasonKey}.${cat.status}`) : ''
          return (
            <div
              key={cat.name}
              className="flex items-start gap-4 rounded-lg border border-compass-line bg-compass-surface p-4"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold ${style.badge}`}
                aria-hidden="true"
              >
                {style.icon}
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-compass-ink">
                  {label}
                  <span className={style.tag}>{t(`score.tierLabels.${cat.status}`)}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-compass-slate">
                  {reason}
                  {cat.status !== 'good' && ` ${t('score.worthConversation')}`}
                </p>
              </div>
            </div>
          )
        })}
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
