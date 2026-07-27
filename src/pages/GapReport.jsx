import { Link } from 'react-router-dom'
import { usePolicy } from '../context/PolicyContext.jsx'

export default function GapReport() {
  const { analysis } = usePolicy()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Areas Worth a Second Look
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Based on your policy, here are some coverage areas that commonly get missed,
        not because your policy is wrong, but because these are easy to overlook
        without a conversation.
      </p>
      <p className="mt-1 text-xs text-compass-slate">
        These aren't errors or guarantees of a gap. They're educational prompts to
        help you ask better questions.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {analysis.gaps.map((gap) => (
          <div key={gap.name} className="card">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-compass-ink">{gap.name}</p>
              <span
                className={
                  gap.status === 'Worth Confirming' ? 'tag-review' : 'tag-neutral'
                }
              >
                {gap.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-compass-slate">
              <strong className="font-medium text-compass-ink">What it is: </strong>
              {gap.what}
            </p>
            <p className="mt-2 text-xs text-compass-slate">
              <strong className="font-medium text-compass-ink">Why it matters: </strong>
              {gap.why}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-compass-paper p-6">
        <p className="text-sm font-medium text-compass-ink">
          What Questions Should You Ask Your Insurance Professional?
        </p>
        <p className="mt-1 text-xs text-compass-slate">
          Use these as a starting point for your next conversation. There are no wrong
          questions.
        </p>
        <ul className="mt-4 space-y-2">
          {analysis.questionsToAsk.map((q) => (
            <li key={q} className="text-sm text-compass-slate">
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/report" className="btn-primary">
          Download Full Report
        </Link>
        <Link to="/learning-center" className="btn-secondary">
          Explore These Topics in the Learning Center
        </Link>
      </div>

      <p className="disclaimer mt-6">
        These coverage areas are identified for educational purposes based on common
        considerations and the information available in your uploaded policy. They do
        not represent confirmed gaps, errors, or recommendations. Only a licensed
        insurance professional can evaluate your specific coverage needs.
      </p>
    </div>
  )
}
