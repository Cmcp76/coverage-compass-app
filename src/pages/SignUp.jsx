import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'

export default function SignUp() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { lang } = useParams()
  const [agreed, setAgreed] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mismatchError, setMismatchError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMismatchError(true)
      return
    }
    setMismatchError(false)
    navigate(localePath(lang, '/verify-email'), { state: { email } })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        Create Your Free Account
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Understand your coverage in minutes. No obligation, no sales calls.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field
          label={t('forms.fullName')}
          type="text"
          placeholder="Maria Alvarez"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Field
          label={t('forms.emailAddress')}
          type="email"
          placeholder="maria@email.com"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t('forms.password')}
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label={t('forms.confirmPassword')}
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatchError ? t('errors:passwordsDontMatch') : null}
        />

        <label className="flex items-start gap-2 text-sm text-compass-slate">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <span>
            <Trans
              i18nKey="forms.agreeToTerms"
              ns="common"
              components={[
                <Link key="terms" to={localePath(lang, '/terms')} target="_blank" rel="noreferrer" className="font-medium text-compass-link hover:underline" />,
                <Link key="privacy" to={localePath(lang, '/privacy')} target="_blank" rel="noreferrer" className="font-medium text-compass-link hover:underline" />,
              ]}
            />
          </span>
        </label>

        <button type="submit" className="btn-primary w-full">
          {t('buttons.createMyAccount')}
        </button>

        <p className="text-center text-sm text-compass-slate">
          <Trans
            i18nKey="forms.alreadyHaveAccount"
            ns="common"
            components={[<Link key="login" to={localePath(lang, '/login')} className="font-medium text-compass-link" />]}
          />
        </p>

        <p className="disclaimer text-center">
          {t('trust.accountLine')}
        </p>
      </form>
    </div>
  )
}

function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-compass-ink">{label}</span>
      <input
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue ${
          error ? 'border-red-400 dark:border-red-400/70' : 'border-compass-line focus:border-compass-blue'
        }`}
      />
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  )
}
