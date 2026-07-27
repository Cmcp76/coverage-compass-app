import { samplePolicy } from '../data/mockData.js'
import { usePolicy } from '../context/PolicyContext.jsx'
import { FooterDisclaimer } from '../components/Disclaimer.jsx'

export default function Report() {
  const { analysis } = usePolicy()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 print:max-w-full">
      <div className="mb-6 flex justify-end print:hidden">
        <button onClick={() => window.print()} className="btn-primary">
          Download PDF
        </button>
      </div>

      <div className="rounded-2xl border border-compass-line bg-white p-10 print:border-none print:p-0">
        {/* Cover */}
        <div className="border-b border-compass-line pb-6 text-center">
          <p className="font-display text-lg font-semibold text-compass-navy">
            Coverage Compass Review
          </p>
          <p className="mt-3 text-sm text-compass-slate">
            Prepared for: <strong>{samplePolicy.customerFullName}</strong>
          </p>
          <p className="text-sm text-compass-slate">
            Document reviewed: {analysis.fileName}
          </p>
          <p className="text-sm text-compass-slate">
            Report Generated: {analysis.analyzedAt}
          </p>
        </div>

        {/* Section 1: Score */}
        <Section title="1. Overall Coverage Score">
          <p className="font-display text-3xl font-semibold text-compass-blue">
            {analysis.coverageScore}/100
          </p>
          <p className="mt-2 text-sm text-compass-slate">
            This score is an educational snapshot of your policy across key protection
            areas. It is not a guarantee of claim outcomes and does not replace a
            licensed insurance professional's review.
          </p>
        </Section>

        {/* Section 2: Summary */}
        <Section title="2. Policy Summary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-compass-line text-left text-xs text-compass-slate">
                <th className="py-2">Coverage</th>
                <th className="py-2">Limit</th>
                <th className="py-2">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {analysis.coverages.map((c) => (
                <tr key={c.name} className="border-b border-compass-line align-top">
                  <td className="py-2 pr-3 font-medium text-compass-ink">{c.name}</td>
                  <td className="py-2 pr-3 text-compass-slate">{c.limit}</td>
                  <td className="py-2 text-compass-slate">{c.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Section 3: Strengths */}
        <Section title="3. Strengths">
          <ul className="list-disc space-y-1 pl-5 text-sm text-compass-slate">
            {analysis.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Section>

        {/* Section 4: Gaps */}
        <Section title="4. Potential Gaps">
          <ul className="list-disc space-y-1 pl-5 text-sm text-compass-slate">
            {analysis.gaps.map((g) => (
              <li key={g.name}>
                <strong className="text-compass-ink">{g.name}:</strong> {g.why}
              </li>
            ))}
          </ul>
        </Section>

        {/* Section 5: Questions */}
        <Section title="5. Questions to Ask Your Insurance Professional">
          <ul className="list-disc space-y-1 pl-5 text-sm text-compass-slate">
            {analysis.questionsToAsk.map((q) => (
              <li key={q}>&ldquo;{q}&rdquo;</li>
            ))}
          </ul>
        </Section>

        {/* Section 6: Next steps */}
        <Section title="6. Next Steps" last>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-compass-slate">
            <li>Review this report alongside your official policy documents.</li>
            <li>Bring your questions to a licensed insurance professional.</li>
            <li>
              Revisit Coverage Compass after any policy changes or renewals to
              generate an updated review.
            </li>
          </ol>
        </Section>

        <div className="mt-8 border-t border-compass-line pt-6">
          <FooterDisclaimer />
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, last }) {
  return (
    <div className={`py-6 ${last ? '' : 'border-b border-compass-line'}`}>
      <p className="mb-3 text-sm font-semibold text-compass-navy">{title}</p>
      {children}
    </div>
  )
}
