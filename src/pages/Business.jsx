import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'

// Business Insurance - a short overview page for the business lines the
// real analysis engine actually supports (general liability, workers' comp),
// then routes into the same real Upload flow used by every other policy
// type. Trucking-specific business insurance has its own dedicated page
// (Start My Trucking Company), linked below rather than duplicated here.
const COVERAGE_AREAS = ['gl', 'workersComp']

export default function Business() {
  const { t } = useTranslation('marketing')
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="tag-neutral">{t('business.eyebrow')}</span>
      <h1 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
        {t('business.heading')}
      </h1>
      <p className="mt-2 text-sm text-compass-slate">{t('business.subhead')}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {COVERAGE_AREAS.map((id) => (
          <div key={id} className="card">
            <h2 className="font-display text-base font-semibold text-compass-heading">
              {t(`business.${id}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-compass-slate">
              {t(`business.${id}.body`)}
            </p>
          </div>
        ))}
      </div>

      <Link
        to={localePath(lang, '/trucking-startup')}
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-compass-line bg-compass-paper px-5 py-4 transition hover:border-compass-blue"
      >
        <div>
          <span className="tag-neutral">{t('business.truckingBadge')}</span>
          <p className="mt-2 text-sm font-medium text-compass-ink">{t('business.truckingTitle')}</p>
          <p className="mt-1 text-xs text-compass-slate">{t('business.truckingBody')}</p>
        </div>
        <span className="btn-secondary shrink-0">{t('business.truckingCta')}</span>
      </Link>

      <Link to={localePath(lang, '/upload')} className="btn-primary mt-8 inline-flex">
        {t('business.uploadCta')}
      </Link>

      <p className="disclaimer mt-8">{t('business.disclaimer')}</p>
    </div>
  )
}
