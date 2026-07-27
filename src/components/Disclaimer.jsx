export function FooterDisclaimer() {
  return (
    <p className="disclaimer">
      Coverage Compass is an independent insurance education platform. It is not an
      insurance company, agency, or broker, and does not sell, bind, cancel, or modify
      insurance policies. Information provided is educational only and does not
      constitute insurance, legal, or financial advice. Coverage decisions should be
      made in consultation with a licensed insurance professional. Coverage Compass
      does not guarantee the accuracy of AI-generated summaries and recommends
      verifying all details against your official policy documents.
    </p>
  )
}

export function InlineEducationalNote({ children }) {
  return (
    <div className="rounded-lg border border-compass-line bg-compass-skyblue/40 px-4 py-3">
      <p className="text-sm text-compass-ink">{children}</p>
    </div>
  )
}
