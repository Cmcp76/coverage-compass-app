import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePolicy } from '../context/PolicyContext.jsx'
import RequestCallback from '../components/RequestCallback.jsx'
import OlderReportBanner from '../components/OlderReportBanner.jsx'
import NoReadableTextBanner from '../components/NoReadableTextBanner.jsx'
import TruncatedDocumentBanner from '../components/TruncatedDocumentBanner.jsx'
import FallbackAnalysisBanner from '../components/FallbackAnalysisBanner.jsx'
import { localePath } from '../utils/localeRouting.js'

// analyzeText()/mockData.js produce these two literal English status strings;
// map them to the matching translation keys rather than translating the raw
// value directly (gapReport.statusLimitLow has no corresponding real status
// value anywhere in the app today, so it's left unmapped).
const STATUS_KEYS = {
  'Worth Confirming': 'gapReport.statusWorthConfirming',
  'Not Found in Policy': 'gapReport.statusNotFound',
}

// Matches the `icon` keys set on each gap rule in policyDomainKnowledge.js.
function GapIcon({ icon }) {
  const common = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (icon) {
    case 'umbrella':
      return (
        <svg {...common}>
          <path d="M12 3v16.5a2 2 0 0 1-4 0" />
          <path d="M3 12a9 9 0 0 1 18 0z" />
        </svg>
      )
    case 'car':
      return (
        <svg {...common}>
          <path d="M4 16V11l2-5h12l2 5v5" />
          <path d="M4 16h16" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </svg>
      )
    case 'tool':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z" />
        </svg>
      )
    case 'droplet':
      return (
        <svg {...common}>
          <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
        </svg>
      )
    case 'shield':
    default:
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        </svg>
      )
  }
}

export default function GapReport() {
  const { t } = useTranslation('common')
  const { analysis } = usePolicy()
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <OlderReportBanner />
      <NoReadableTextBanner />
      <TruncatedDocumentBanner />
      <FallbackAnalysisBanner />
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        {t('gapReport.title')}
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        {t('gapReport.subheadline')}
      </p>
      <p className="mt-1 text-xs text-compass-slate">
        These aren't errors or guarantees of a gap. They're educational prompts to
        help you ask better questions.
      </p>

      <div className="-mx-6 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0">
        {analysis.gaps.map((gap) => (
          <div
            key={gap.name}
            className="w-64 shrink-0 snap-start rounded-2xl border border-compass-line bg-compass-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-compass-skyblue text-compass-link">
                <GapIcon icon={gap.icon} />
              </span>
              <span
                className={
                  gap.status === 'Worth Confirming' ? 'tag-review' : 'tag-neutral'
                }
              >
                {STATUS_KEYS[gap.status] ? t(STATUS_KEYS[gap.status]) : gap.status}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-compass-ink">{gap.name}</p>
            <p className="mt-2 text-xs leading-relaxed text-compass-slate">{gap.what}</p>
            <p className="mt-2 text-xs leading-relaxed text-compass-slate">{gap.why}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <RequestCallback />
      </div>

      <div className="mt-8 rounded-xl bg-compass-paper p-6">
        <p className="text-sm font-medium text-compass-ink">
          {t('gapReport.questionsHeadline')}
        </p>
        <p className="mt-1 text-xs text-compass-slate">
          Use these as a starting point for your next conversation. There are no wrong
          questions.
        </p>
        <ul className="mt-4 space-y-2">
          {analysis.questionsToAsk.map((q) => (
            <li key={q} className="text-sm text-compass-slate">
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={localePath(lang, '/report')} className="btn-primary">
          {t('buttons.downloadFullReport')}
        </Link>
        <Link to={localePath(lang, '/learning-center')} className="btn-secondary">
          Explore These Topics in the Learning Center
        </Link>
      </div>

      <p className="disclaimer mt-6">
        These coverage areas are identified for educational purposes based on common
        considerations and the information available in your uploaded policy. They do
        not represent confirmed gaps, errors, or recommendations. Only a licensed
        insurance professional can evaluate your specific coverage needs.
      </p>
    </div>
  )
}
