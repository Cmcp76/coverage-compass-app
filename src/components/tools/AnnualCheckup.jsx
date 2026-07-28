import { useState } from 'react'
import { Link } from 'react-router-dom'

const prompts = [
  'Have you moved, renovated, or made major purchases this year?',
  'Has your household changed (marriage, new driver, dependent, etc.)?',
  'Have you started a side business or started driving for work/delivery?',
  'Has your business added employees, vehicles, or equipment?',
  'Has it been more than 12 months since your last policy review?',
]

export default function AnnualCheckup() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const yesCount = Object.values(answers).filter((a) => a === 'Yes').length
  const allAnswered = prompts.every((_, i) => answers[i])

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-navy">
        Annual Insurance Checkup
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        A short yearly check-in to help you catch changes worth reviewing with your
        insurance professional.
      </p>

      <div className="mt-5 space-y-4">
        {prompts.map((p, i) => (
          <div key={p} className="flex items-center justify-between gap-4">
            <p className="text-sm text-compass-ink">{p}</p>
            <div className="flex shrink-0 gap-2">
              {['Yes', 'No'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    answers[i] === opt
                      ? 'bg-compass-blue text-white'
                      : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered}
        onClick={() => setSubmitted(true)}
        className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-40"
      >
        See My Results
      </button>

      {submitted && (
        <div role="status" className="mt-5 rounded-lg bg-compass-paper p-4">
          <p className="text-sm text-compass-ink">
            {yesCount > 0
              ? `Based on your answers, it looks like you've had ${yesCount} change${yesCount > 1 ? 's' : ''} worth reviewing. These are common reasons policies fall out of date. Consider reaching out to your insurance professional to confirm your coverage still fits.`
              : "Based on your answers, it doesn't look like much has changed this year. Still, an annual check-in with your insurance professional is a good habit."}
          </p>
          <Link to="/upload" className="btn-secondary mt-4 inline-flex">
            Re-Upload Your Policy for an Updated Review
          </Link>
        </div>
      )}
    </div>
  )
}
