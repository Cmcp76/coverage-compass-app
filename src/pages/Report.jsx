import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePolicy } from '../context/PolicyContext.jsx'
import { FooterDisclaimer } from '../components/Disclaimer.jsx'
import OlderReportBanner from '../components/OlderReportBanner.jsx'

export default function Report() {
  const { t } = useTranslation('common')
  const { analysis } = usePolicy()
  const [generating, setGenerating] = useState(false)

  async function downloadPdf() {
    setGenerating(true)
    try {
      // jsPDF is a large dependency and most visits to this page just read
      // it or click Print, so load it only when a PDF is actually requested
      // instead of paying its bundle cost on every visit to /report.
      const { generateReportPdf } = await import('../lib/generateReportPdf.js')
      const doc = generateReportPdf(analysis)
      doc.save('coverage-compass-review.pdf')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 print:max-w-full">
      <OlderReportBanner />
      <div className="mb-6 flex justify-end gap-3 print:hidden">
        <button onClick={() => window.print()} className="btn-secondary">
          Print
        </button>
        <button onClick={downloadPdf} disabled={generating} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {generating ? 'Preparing…' : t('buttons.downloadPdf')}
        </button>
      </div>

      <div className="rounded-2xl border border-compass-line bg-compass-surface p-10 print:border-none print:p-0">
        {/* Cover */}
        <div className="border-b border-compass-line pb-6 text-center">
          <p className="font-display text-lg font-semibold text-compass-heading">
            Coverage Compass Review
          </p>
          {analysis.namedInsured && (
            <p className="mt-3 text-sm text-compass-slate">
              Prepared for: <strong>{analysis.namedInsured}</strong>
            </p>
          )}
          <p className="text-sm text-compass-slate">
            Document reviewed: {analysis.fileName}
          </p>
          <p className="text-sm text-compass-slate">
            Report Generated: {analysis.analyzedAt}
          </p>
        </div>

        {/* Section 1: Score */}
        <Section title="1. Overall Coverage Score">
          <p className="font-display text-3xl font-semibold text-compass-link">
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
          {/* The explanation column's content routinely needs more room than
              a narrow phone screen has to give without wrapping into an
              unreadable single-word-per-line mess, so let the table itself
              scroll horizontally within its own box instead of pushing the
              whole page wider than the viewport (which happened before this
              wrapper existed). print:overflow-visible so a printed/downloaded
              copy still shows the full table instead of clipping it. */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[560px] text-sm print:min-w-0">
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
          </div>
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
      <p className="mb-3 text-sm font-semibold text-compass-heading">{title}</p>
      {children}
    </div>
  )
}
