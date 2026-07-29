import { Link, useNavigate, useParams } from 'react-router-dom'
import { localePath } from '../utils/localeRouting.js'

export default function Login() {
  const navigate = useNavigate()
  const { lang } = useParams()

  function handleSubmit(e) {
    e.preventDefault()
    navigate(localePath(lang, '/dashboard'))
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
            Email Address
          </span>
          <input
            type="email"
            placeholder="maria@email.com"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-compass-ink">
            Password
          </span>
          <input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
          />
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-compass-slate">
            <input type="checkbox" /> Remember Me
          </label>
          <Link to={localePath(lang, '/reset-password')} className="font-medium text-compass-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full">
          Log In
        </button>

        <p className="text-center text-sm text-compass-slate">
          Don't have an account?{' '}
          <Link to={localePath(lang, '/signup')} className="font-medium text-compass-link">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}
