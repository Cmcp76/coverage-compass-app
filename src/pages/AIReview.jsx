import { Link } from 'react-router-dom'
import { usePolicy } from '../context/PolicyContext.jsx'
import { InlineEducationalNote } from '../components/Disclaimer.jsx'

export default function AIReview() {
  const { analysis } = usePolicy()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-compass-skyblue">
          <span className="text-compass-blue">✓</span>
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-compass-navy">
            Policy Summary
          </h1>
          <p className="text-sm text-compass-slate">
            {analysis.detectedPolicyType} &middot; {analysis.fileName} &middot; reviewed{' '}
            {analysis.analyzedAt}
          </p>
        </div>
      </div>

      {!analysis.hasRealText && (
        <div className="mb-4 rounded-lg border border-compass-line bg-compass-paper px-4 py-3 text-xs text-compass-slate">
          No readable text was found in this document (common with photos or scanned
          images), so nothing below could be confirmed, everything is labeled NEEDED
          INFORMATION. Upload a text-based PDF or .txt file for a review based on your
          actual policy.
        </div>
      )}

      <div className="space-y-3">
        {analysis.coverages.map((cov) => (
          <div
            key={cov.name}
            className={`flex items-start justify-between gap-3 rounded-lg border border-compass-line px-4 py-3 ${
              cov.confidence === 'missing' ? 'bg-compass-paper' : 'bg-white'
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

      <div className="mt-6">
        <InlineEducationalNote>
          {analysis.strengths[0]} Some sections of the uploaded document may be
          unclear or missing, these are labeled above as NEEDED INFORMATION.
        </InlineEducationalNote>
      </div>

      <Link to="/score" className="btn-primary mt-8 flex w-full justify-center">
        See My Coverage Score
      </Link>
    </div>
  )
}
