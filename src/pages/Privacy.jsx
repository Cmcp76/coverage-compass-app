import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FooterDisclaimer } from '../components/Disclaimer.jsx'
import { localePath } from '../utils/localeRouting.js'

export default function Privacy() {
  const { t } = useTranslation('common')
  const { lang } = useParams()
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">{t('footer.privacyPolicy')}</h1>
      <p className="mt-4 text-sm leading-relaxed text-compass-slate">
        Coverage Compass is a prototype. What happens to your uploaded document
        depends on whether AI-powered analysis is available, described below -
        read this before uploading anything you wouldn't want to leave your device.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        How your policy is handled
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        When AI-powered analysis is available, the text extracted from your
        uploaded document is sent to our server, which passes it to Anthropic's
        Claude API to generate your review. Coverage Compass does not store that
        text once your review is generated. This is not processed "entirely in
        your browser" in that case - see{' '}
        <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer" className="font-medium text-compass-link hover:underline">
          Anthropic's privacy policy
        </a>{' '}
        for how they handle API data.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        If AI-powered analysis isn't available, Coverage Compass falls back to a
        local, pattern-matching review that runs entirely in your browser - in
        that case nothing you upload is transmitted anywhere.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        Either way, the resulting summary and your review history are saved to
        your browser's local storage so they're available the next time you visit
        this device, and clearing your browser data removes them.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        Account details
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        Sign-up and login in this prototype are simulated for demonstration
        purposes. No account, email address, or password is created, verified, or
        stored anywhere.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        Cookies and analytics
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        This prototype does not use tracking cookies or analytics.
      </p>
      <div className="mt-10">
        <Link to={localePath(lang, '/')} className="text-sm font-medium text-compass-link">
          Back to Home
        </Link>
      </div>
      <div className="mt-10 border-t border-compass-line pt-6">
        <FooterDisclaimer />
      </div>
    </div>
  )
}
