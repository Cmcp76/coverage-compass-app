import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-compass-skyblue text-compass-link">
        <CompassIcon />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-compass-heading">
        Page Not Found
      </h1>
      <p className="mt-3 text-sm text-compass-slate">
        We couldn't find the page you were looking for. It may have moved, or the
        link might be out of date.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link to="/dashboard" className="btn-primary px-6 py-3">
          Go to Dashboard
        </Link>
        <Link to="/" className="text-sm font-medium text-compass-link">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

function CompassIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15 9l-2 5-5 2 2-5 5-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
