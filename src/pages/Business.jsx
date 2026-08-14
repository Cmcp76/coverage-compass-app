import { Link, useParams } from 'react-router-dom'
import { localePath } from '../utils/localeRouting.js'

// Business Insurance - a short overview page for the business lines the
// real analysis engine actually supports (general liability, workers' comp),
// then routes into the same real Upload flow used by every other policy
// type. Trucking-specific business insurance has its own dedicated page
// (Start My Trucking Company), linked below rather than duplicated here.
const COVERAGE_AREAS = [
  {
    title: 'Commercial General Liability',
    body: 'Premises and products liability, completed operations, additional insured language, and certificate-of-insurance requirements landlords and contracts often ask for.',
  },
  {
    title: "Workers' Compensation",
    body: 'Payroll exposure, class codes, experience mod, and the owner-vs-employee coverage questions that trip up small business owners.',
  },
]

export default function Business() {
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="tag-neutral">Business Insurance</span>
      <h1 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
        Understand What Your Business Policy Actually Covers
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Upload your general liability or workers' compensation policy for a
        plain-language review, what's covered, what your limits are, and where there
        might be gaps worth a second look.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {COVERAGE_AREAS.map((area) => (
          <div key={area.title} className="card">
            <h2 className="font-display text-base font-semibold text-compass-heading">
              {area.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-compass-slate">{area.body}</p>
          </div>
        ))}
      </div>

      <Link
        to={localePath(lang, '/trucking-startup')}
        className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-compass-line bg-compass-paper px-5 py-4 transition hover:border-compass-blue"
      >
        <div>
          <span className="tag-neutral">Trucking</span>
          <p className="mt-2 text-sm font-medium text-compass-ink">
            Running a trucking or motor carrier business?
          </p>
          <p className="mt-1 text-xs text-compass-slate">
            A step-by-step checklist for business formation, FMCSA authority, and the
            coverage that matches your operation.
          </p>
        </div>
        <span className="btn-secondary shrink-0">Start My Trucking Checklist</span>
      </Link>

      <Link to={localePath(lang, '/upload')} className="btn-primary mt-8 inline-flex">
        Upload My Business Policy
      </Link>

      <p className="disclaimer mt-8">
        Coverage Compass currently reviews general liability and workers' compensation
        policies. It does not cover every commercial line, and it is not a substitute
        for advice from a licensed insurance professional about your specific business.
      </p>
    </div>
  )
}
