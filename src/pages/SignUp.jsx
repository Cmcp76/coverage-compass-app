import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignUp() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
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
    navigate('/verify-email', { state: { email } })
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
        <Field label="Full Name" type="text" placeholder="Maria Alvarez" required />
        <Field
          label="Email Address"
          type="email"
          placeholder="maria@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatchError ? "Passwords don't match." : null}
        />

        <label className="flex items-start gap-2 text-sm text-compass-slate">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          I agree to the Terms of Service and Privacy Policy
        </label>

        <button type="submit" className="btn-primary w-full">
          Create My Account
        </button>

        <p className="text-center text-sm text-compass-slate">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-compass-link">
            Log In
          </Link>
        </p>

        <p className="disclaimer text-center">
          Your information is encrypted and never sold. Coverage Compass is an
          independent educational platform, not an insurance company.
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
          error ? 'border-red-400' : 'border-compass-line focus:border-compass-blue'
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
