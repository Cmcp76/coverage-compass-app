import { useState } from 'react'

const fullGlossary = [
  { term: 'Actual Cash Value (ACV)', definition: 'The value of property at the time of loss, replacement cost minus depreciation.' },
  { term: 'Additional Insured', definition: 'A person or business added to someone else\u2019s policy to receive some of the same protections.' },
  { term: 'BOC-3 Filing', definition: 'A designation of process agents required for motor carriers operating under FMCSA authority.' },
  { term: 'Certificate of Insurance (COI)', definition: 'A document summarizing a policy\u2019s coverage, often requested by landlords or contractors.' },
  { term: 'Cyber Liability Insurance', definition: 'Coverage for costs from data breaches, ransomware, and other cyber incidents, typically excluded from standard general liability policies.' },
  { term: 'Declarations Page', definition: 'The summary page of your policy, usually the first page, showing who\u2019s insured, what\u2019s covered, your limits, deductibles, and effective dates.' },
  { term: 'Deductible', definition: 'The amount you pay out of pocket before your insurance coverage begins to pay.' },
  { term: 'Endorsement', definition: 'A change or addition to your policy that adjusts, adds, or removes coverage from the base policy.' },
  { term: 'Experience Modifier (Mod)', definition: 'A factor used in workers\u2019 compensation pricing based on a business\u2019s claims history relative to peers.' },
  { term: 'General Liability (GL)', definition: 'Coverage for third-party bodily injury, property damage, and related claims arising from business operations.' },
  { term: 'Loss Run', definition: 'A report from an insurer summarizing a policyholder\u2019s claims history over a period of time.' },
  { term: 'MC Authority', definition: 'Operating authority granted by the FMCSA allowing a motor carrier to transport goods for compensation.' },
  { term: 'Named Insured', definition: 'The person or entity specifically identified on the declarations page as covered under the policy.' },
  { term: 'Pro-Rata', definition: 'A method of calculating a refund or charge proportional to the time remaining or used in a policy period.' },
  { term: 'Subrogation', definition: 'The process by which your insurance company seeks reimbursement from an at-fault party\u2019s insurer after paying your claim.' },
  { term: 'Umbrella Policy', definition: 'Extra liability protection that applies above the limits of your underlying auto or home policy.' },
  { term: 'USDOT Number', definition: 'A unique identifier the FMCSA assigns to companies operating commercial vehicles.' },
]

export default function Glossary() {
  const [search, setSearch] = useState('')

  const filtered = fullGlossary.filter((g) =>
    g.term.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped = filtered.reduce((acc, g) => {
    const letter = g.term[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(g)
    return acc
  }, {})

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-navy">
        Insurance Glossary
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        Plain-language definitions for the terms you'll actually run into.
      </p>

      <input
        type="text"
        aria-label="Search the glossary"
        placeholder="Search a term..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
      />

      <div className="mt-5 space-y-5">
        {Object.keys(grouped)
          .sort()
          .map((letter) => (
            <div key={letter}>
              <p className="text-xs font-semibold uppercase tracking-wide text-compass-blue">
                {letter}
              </p>
              <div className="mt-2 space-y-3">
                {grouped[letter].map((g) => (
                  <div key={g.term}>
                    <p className="text-sm font-medium text-compass-ink">{g.term}</p>
                    <p className="text-xs text-compass-slate">{g.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        {filtered.length === 0 && (
          <p className="text-sm text-compass-slate">No terms match your search.</p>
        )}
      </div>
    </div>
  )
}
