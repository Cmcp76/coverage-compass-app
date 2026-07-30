import { Link, useParams } from 'react-router-dom'
import { usePolicy } from '../context/PolicyContext.jsx'
import { localePath } from '../utils/localeRouting.js'
import NoReadableTextBanner from '../components/NoReadableTextBanner.jsx'
import TruncatedDocumentBanner from '../components/TruncatedDocumentBanner.jsx'

export default function AIReview() {
  const { analysis } = usePolicy()
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-compass-skyblue">
          <span className="text-compass-link">✓</span>
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-compass-heading">
            Policy Summary
          </h1>
          <p className="text-sm text-compass-slate">
            {analysis.detectedPolicyType} &middot; {analysis.fileName} &middot; reviewed{' '}
            {analysis.analyzedAt}
          </p>
        </div>
      </div>

      {analysis.isDemo && (
        <div className="mb-4 rounded-lg border border-compass-line bg-compass-paper px-4 py-3 text-xs text-compass-slate">
          You haven't uploaded a policy yet, so this is sample demo data showing what a
          review looks like. Upload your policy to get a review of your actual coverage.
        </div>
      )}
      <NoReadableTextBanner />
      <TruncatedDocumentBanner />

      <div className="space-y-3">
        {analysis.coverages.map((cov) => (
          <div
            key={cov.name}
            className={`flex items-start justify-between gap-3 rounded-lg border border-compass-line px-4 py-3 ${
              cov.confidence === 'missing' ? 'bg-compass-paper' : 'bg-compass-surface'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-compass-ink">{cov.name}</p>
              <p className="text-sm text-compass-slate">{cov.limit}</p>
              <p className="mt-1 text-xs text-compass-slate">{cov.explanation}</p>
            </div>
            <span
              className={`whitespace-nowrap text-xs ${
                cov.confidence === 'high'
                  ? 'text-compass-green'
                  : cov.confidence === 'medium'
                    ? 'text-compass-amber'
                    : 'text-compass-slate'
              }`}
            >
              {cov.confidence === 'high'
                ? 'High confidence'
                : cov.confidence === 'medium'
                  ? 'Mentioned in document'
                  : 'Not found in document'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-compass-line bg-compass-skyblue/40 px-4 py-3">
        <p className="text-sm font-medium text-compass-ink">What looks solid</p>
        <ul className="mt-2 space-y-1">
          {analysis.strengths.map((strength) => (
            <li key={strength} className="text-sm text-compass-ink">
              {strength}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-compass-ink">
          Some sections of the uploaded document may be unclear or missing, these are
          labeled above as NEEDED INFORMATION.
        </p>
      </div>

      <Link to={localePath(lang, '/score')} className="btn-primary mt-8 flex w-full justify-center">
        See My Coverage Score
      </Link>
    </div>
  )
}
