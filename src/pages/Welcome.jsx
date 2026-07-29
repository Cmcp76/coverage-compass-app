import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-compass-mint">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            className="text-compass-green"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-compass-heading">
        You're All Set, Maria
      </h1>
      <p className="mt-3 text-compass-slate">
        Welcome to Coverage Compass. Let's take a look at what's actually in your
        policy.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-compass-slate">
        Upload your first policy, a declarations page, ACORD form, or full policy
        document, and we'll break it down into plain language, flag anything worth a
        second look, and prepare you with smart questions for your next conversation
        with a licensed insurance professional.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link to="/upload" className="btn-primary px-6 py-3">
          Upload Your First Policy
        </Link>
        <Link to="/learning-center" className="text-sm font-medium text-compass-link">
          Explore the Learning Center first
        </Link>
      </div>
    </div>
  )
}
