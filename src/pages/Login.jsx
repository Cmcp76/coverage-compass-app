import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { localePath } from '../utils/localeRouting.js'
import { useAuth, AuthNotConfiguredError } from '../context/AuthContext.jsx'

export default function Login() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { lang } = useParams()
  const { logIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await logIn({ email, password })
      navigate(localePath(lang, '/dashboard'))
    } catch (err) {
      if (err instanceof AuthNotConfiguredError) {
        // No accounts backend deployed - fall back to the prototype's
        // original simulated flow rather than blocking someone from ever
        // reaching the dashboard just because real accounts aren't set up.
        navigate(localePath(lang, '/dashboard'))
        return
      }
      setError(err.message || 'Something went wrong logging in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        Welcome Back
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Log in to view your Coverage Score, reports, and saved policies.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-compass-ink">
            {t('forms.emailAddress')}
          </span>
          <input
            type="email"
            placeholder="maria@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-compass-ink">
            {t('forms.password')}
          </span>
          <input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-compass-slate">
            <input type="checkbox" /> {t('forms.rememberMe')}
          </label>
          <Link to={localePath(lang, '/reset-password')} className="font-medium text-compass-link">
            {t('forms.forgotPassword')}
          </Link>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Logging In…' : t('buttons.logIn')}
        </button>

        <p className="text-center text-sm text-compass-slate">
          <Trans
            i18nKey="forms.dontHaveAccount"
            ns="common"
            components={[<Link key="signup" to={localePath(lang, '/signup')} className="font-medium text-compass-link" />]}
          />
        </p>
      </form>
    </div>
  )
}
