import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'
import RequestCallback from '../components/RequestCallback.jsx'

// Claims Help - plain-language guidance for what to do around a claim.
// Purely educational content (no claims are filed or processed here),
// consistent with the rest of the app's education-only positioning.
const STEP_IDS = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8']
const FAQ_IDS = ['faq1', 'faq2', 'faq3']

export default function ClaimsHelp() {
  const { t } = useTranslation('marketing')
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="tag-neutral">{t('claimsHelp.eyebrow')}</span>
      <h1 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
        {t('claimsHelp.heading')}
      </h1>
      <p className="mt-2 text-sm text-compass-slate">{t('claimsHelp.subhead')}</p>

      <div className="mt-8 space-y-4">
        {STEP_IDS.map((id, i) => (
          <div key={id} className="card flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-compass-coraltint text-sm font-bold text-compass-coral">
              {i + 1}
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-compass-heading">
                {t(`claimsHelp.${id}.title`)}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-compass-slate">
                {t(`claimsHelp.${id}.body`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-compass-heading">
          {t('claimsHelp.faqHeading')}
        </h2>
        <div className="mt-4 space-y-3">
          {FAQ_IDS.map((id) => (
            <details key={id} className="rounded-lg border border-compass-line bg-compass-surface p-4">
              <summary className="cursor-pointer list-none font-medium text-compass-ink marker:content-none">
                <span className="flex items-center justify-between">
                  {t(`claimsHelp.${id}.q`)}
                  <span className="text-compass-link">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-compass-slate">
                {t(`claimsHelp.${id}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <RequestCallback ctaLabel={t('claimsHelp.talkToProfessional')} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={localePath(lang, '/upload')} className="btn-primary">
          {t('claimsHelp.reviewBeforeFiling')}
        </Link>
        <Link to={localePath(lang, '/learning-center')} className="btn-secondary">
          {t('claimsHelp.exploreLearningCenter')}
        </Link>
      </div>

      <p className="disclaimer mt-6">{t('claimsHelp.disclaimer')}</p>
    </div>
  )
}
