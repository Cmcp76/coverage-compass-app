import { Fragment, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'

export default function ResetPassword() {
  const { t } = useTranslation('common')
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatchError, setMismatchError] = useState(false)
  const navigate = useNavigate()
  const { lang } = useParams()

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      {step === 1 ? (
        <Fragment key="step-1">
          <h1 className="font-display text-2xl font-semibold text-compass-heading">
            Reset Your Password
          </h1>
          <p className="mt-2 text-sm text-compass-slate">
            Enter the email address associated with your account, and we'll send you a
            link to reset your password.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setStep(2)
            }}
            className="mt-8 space-y-4"
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-compass-ink">
                {t('forms.emailAddress')}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
              />
            </label>
            <button type="submit" className="btn-primary w-full">
              {t('buttons.sendResetLink')}
            </button>
          </form>
        </Fragment>
      ) : (
        <Fragment key="step-2">
          <h1 className="font-display text-2xl font-semibold text-compass-heading">
            Choose a New Password
          </h1>
          <p className="mt-2 text-sm text-compass-slate">
            If an account exists for that email, a reset link is on its way. For this
            prototype, continue directly below.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (password !== confirmPassword) {
                setMismatchError(true)
                return
              }
              setMismatchError(false)
              navigate(localePath(lang, '/login'))
            }}
            className="mt-8 space-y-4"
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-compass-ink">
                {t('forms.newPassword')}
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-compass-ink">
                {t('forms.confirmNewPassword')}
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue ${
                  mismatchError
                    ? 'border-red-400 dark:border-red-400/70'
                    : 'border-compass-line focus:border-compass-blue'
                }`}
              />
              {mismatchError && (
                <span role="alert" className="mt-1 block text-xs text-red-600 dark:text-red-400">
                  {t('errors:passwordsDontMatch')}
                </span>
              )}
            </label>
            <button type="submit" className="btn-primary w-full">
              {t('buttons.updatePassword')}
            </button>
          </form>
        </Fragment>
      )}
    </div>
  )
}
