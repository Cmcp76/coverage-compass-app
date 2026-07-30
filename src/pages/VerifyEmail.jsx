import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'

export default function VerifyEmail() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { lang } = useParams()
  const [resent, setResent] = useState(false)
  const email = location.state?.email

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-compass-skyblue">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" className="text-compass-link" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 7l8 6 8-6" className="text-compass-link" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold text-compass-heading">
        Check Your Inbox
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        In a live version of Coverage Compass, we'd send a verification link to{' '}
        <strong>{email || 'the email address you signed up with'}</strong>. This is
        a prototype with no real account or email delivery, so continue below to
        simulate verifying your account.
      </p>
      <p className="mt-4 text-sm text-compass-slate">
        Nothing was actually sent, there's no inbox to check for this prototype.
      </p>
      <button
        className="btn-secondary mx-auto mt-4 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={resent}
        onClick={() => setResent(true)}
      >
        {resent ? t('buttons.verificationEmailSent') : t('buttons.resendVerificationEmail')}
      </button>
      {resent && (
        <p role="status" className="mt-2 text-xs text-compass-green">
          In a live version, a new email would be sent now. This is a prototype, so
          nothing was actually sent.
        </p>
      )}

      <button className="btn-primary mx-auto mt-8" onClick={() => navigate(localePath(lang, '/welcome'))}>
        Simulate verification (prototype)
      </button>
    </div>
  )
}
