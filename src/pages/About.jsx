import { Link, useParams } from 'react-router-dom'
import { FooterDisclaimer } from '../components/Disclaimer.jsx'
import { localePath } from '../utils/localeRouting.js'

export default function About() {
  const { lang } = useParams()
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">About Coverage Compass</h1>
      <p className="mt-4 text-sm leading-relaxed text-compass-slate">
        Insurance policies are long, dense, and full of language most people never
        get a plain explanation of until they're already filing a claim. Coverage
        Compass exists to close that gap: upload a declarations page or full policy
        and get a plain-language breakdown of what's covered, what might be missing,
        and what's worth asking a licensed professional about.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-compass-slate">
        This project is a prototype. It's built to demonstrate what a coverage
        education tool could look like, not to replace an insurance agent, broker,
        or attorney. Every summary it produces is meant as a starting point for a
        conversation, not a final word on your coverage.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        What it does
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-compass-slate">
        <li>Detects the line of business (auto, homeowners, renters, general liability, workers' comp, or trucking) from the policy text.</li>
        <li>Summarizes coverages in plain language, with the limits and deductibles it can find.</li>
        <li>Flags common gaps for that policy type, coverages many policies of the same kind include but this one might not.</li>
        <li>Suggests questions worth asking an agent before you rely on the policy.</li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={localePath(lang, '/')} className="btn-secondary">
          Back to Home
        </Link>
        <Link to={localePath(lang, '/upload')} className="btn-primary">
          Try It
        </Link>
      </div>
      <div className="mt-10 border-t border-compass-line pt-6">
        <FooterDisclaimer />
      </div>
    </div>
  )
}
