import { useState } from 'react'

const emptyPolicy = { liability: '', deductible: '', endorsements: '' }

export default function ComparisonTool() {
  const [a, setA] = useState({ ...emptyPolicy, liability: '250,000', deductible: '500', endorsements: 'Roadside assistance' })
  const [b, setB] = useState({ ...emptyPolicy, liability: '100,000', deductible: '1,000', endorsements: '—' })

  const liabilityDiff = parseNum(a.liability) - parseNum(b.liability)
  const deductibleDiff = parseNum(a.deductible) - parseNum(b.deductible)

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-heading">
        Coverage Comparison Tool
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        Compare two policies or two coverage options side by side, in plain language.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <PolicyColumn label="Policy A" values={a} onChange={setA} />
        <PolicyColumn label="Policy B" values={b} onChange={setB} />
      </div>

      <div className="mt-5 space-y-2 rounded-lg bg-compass-paper p-4 text-sm text-compass-ink">
        {liabilityDiff !== 0 && (
          <p>
            Policy {liabilityDiff > 0 ? 'A' : 'B'} has a $
            {Math.abs(liabilityDiff).toLocaleString()} higher liability limit than
            Policy {liabilityDiff > 0 ? 'B' : 'A'}.
          </p>
        )}
        {deductibleDiff !== 0 && (
          <p>
            Policy {deductibleDiff > 0 ? 'B' : 'A'} has a lower deductible by $
            {Math.abs(deductibleDiff).toLocaleString()}.
          </p>
        )}
        {liabilityDiff === 0 && deductibleDiff === 0 && (
          <p>These two policies show the same liability limit and deductible.</p>
        )}
      </div>

      <p className="disclaimer mt-4">
        This tool compares the numbers you enter. It doesn't verify accuracy against
        an actual policy document or account for state-specific requirements, for
        that, upload your policy directly or speak with your insurance professional.
      </p>
    </div>
  )
}

function parseNum(str) {
  return parseFloat(String(str).replace(/,/g, '')) || 0
}

function PolicyColumn({ label, values, onChange }) {
  return (
    <div className="rounded-lg border border-compass-line p-4">
      <p className="mb-3 text-sm font-medium text-compass-ink">{label}</p>
      <div className="space-y-3">
        <Field
          label="Liability limit ($)"
          value={values.liability}
          onChange={(v) => onChange({ ...values, liability: v })}
        />
        <Field
          label="Deductible ($)"
          value={values.deductible}
          onChange={(v) => onChange({ ...values, deductible: v })}
        />
        <Field
          label="Key endorsements"
          value={values.endorsements}
          onChange={(v) => onChange({ ...values, endorsements: v })}
        />
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-compass-slate">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
      />
    </label>
  )
}
