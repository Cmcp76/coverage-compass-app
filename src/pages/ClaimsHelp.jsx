import { Link, useParams } from 'react-router-dom'
import { localePath } from '../utils/localeRouting.js'
import RequestCallback from '../components/RequestCallback.jsx'

// Claims Help - plain-language guidance for what to do around a claim.
// Purely educational content (no claims are filed or processed here),
// consistent with the rest of the app's education-only positioning.
const STEPS = [
  {
    title: 'Make sure everyone is safe first',
    body: 'Before anything else, get to a safe place and get medical attention if anyone is hurt. Documentation and paperwork can always wait.',
  },
  {
    title: 'Document everything you can',
    body: 'Photos and videos of the damage, the scene, and anything relevant, as soon as it’s safe to take them. Write down what happened while it’s fresh, dates, times, and who was involved.',
  },
  {
    title: 'Report it to your insurance company promptly',
    body: 'Most policies require "prompt" notice, and waiting too long can complicate a claim. Have your policy number and the basic facts ready when you call.',
  },
  {
    title: 'Know your deductible before you file',
    body: 'If the damage is close to or below your deductible, filing a claim may not make financial sense, ask your carrier what your out-of-pocket cost would actually be.',
  },
  {
    title: 'Keep a record of every conversation',
    body: 'Note the date, the name of who you spoke with, your claim number, and what was discussed. This matters if there’s ever a disagreement about what was said.',
  },
  {
    title: 'Understand how your payout will be calculated',
    body: 'Ask whether your policy pays actual cash value (depreciated) or replacement cost, for the same damage, those numbers can be very different.',
  },
  {
    title: "Get a second opinion on repair estimates",
    body: "You're not required to use the first repair shop your insurer suggests. Getting an independent estimate can be worth the time on a larger claim.",
  },
  {
    title: 'Follow up if things stall',
    body: "If your claim goes quiet, follow up in writing and ask for a status update. Most states have an insurance department that can help if a claim seems unreasonably delayed.",
  },
]

const FAQS = [
  {
    q: 'Will filing a claim raise my premium?',
    a: "It can, especially for an at-fault claim, but it depends on your carrier, your state, and your claims history. Ask your carrier directly before you decide whether to file.",
  },
  {
    q: 'What if my claim gets denied?',
    a: 'Ask for the denial in writing with the specific policy language cited. You can request a re-review, involve your state insurance department, or consult an attorney for a significant claim.',
  },
  {
    q: 'Do I need a public adjuster?',
    a: "For a straightforward claim, usually not. For a large or contested claim (major fire or storm damage), some people hire an independent public adjuster to negotiate on their behalf, for a fee.",
  },
]

export default function ClaimsHelp() {
  const { lang } = useParams()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <span className="tag-neutral">Claims Help</span>
      <h1 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
        What to Do When You Need to File a Claim
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        General, plain-language guidance for navigating a claim, whether it just happened
        or you're already in the middle of one.
      </p>

      <div className="mt-8 space-y-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="card flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-compass-coraltint text-sm font-bold text-compass-coral">
              {i + 1}
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-compass-heading">
                {step.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-compass-slate">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-compass-heading">
          Common questions
        </h2>
        <div className="mt-4 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="rounded-lg border border-compass-line bg-compass-surface p-4">
              <summary className="cursor-pointer list-none font-medium text-compass-ink marker:content-none">
                <span className="flex items-center justify-between">
                  {f.q}
                  <span className="text-compass-link">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-compass-slate">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <RequestCallback ctaLabel="Talk to a Licensed Professional" />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={localePath(lang, '/upload')} className="btn-primary">
          Review My Policy Before I File
        </Link>
        <Link to={localePath(lang, '/learning-center')} className="btn-secondary">
          Explore More in the Learning Center
        </Link>
      </div>

      <p className="disclaimer mt-6">
        This page provides general educational information about the claims process. It
        does not file, process, or track any actual insurance claim, and it is not a
        substitute for advice from your insurance carrier or a licensed insurance
        professional about your specific situation.
      </p>
    </div>
  )
}
