import { useState } from 'react'
import { Link } from 'react-router-dom'

const initialNotifications = [
  {
    id: 1,
    kind: 'alert',
    title: 'Coverage alert',
    body: "Your policy doesn't show rental reimbursement, worth asking about.",
    to: '/gap-report',
  },
  {
    id: 2,
    kind: 'renewal',
    title: 'Renewal reminder',
    body: 'Homeowners policy renews in 30 days.',
    to: '/dashboard',
  },
  {
    id: 3,
    kind: 'education',
    title: 'New article',
    body: '5 Questions Every Small Business Owner Should Ask About Their GL Policy',
    to: '/learning-center',
  },
  {
    id: 4,
    kind: 'report',
    title: 'Report ready',
    body: 'Your Coverage Score report is ready to view.',
    to: '/report',
  },
]

const kindIcon = {
  alert: '🔔',
  renewal: '📅',
  education: '📘',
  report: '✅',
}

export default function Notifications() {
  const [items, setItems] = useState(initialNotifications)

  function dismiss(id) {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Notifications
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-compass-line p-10 text-center">
          <p className="text-sm font-medium text-compass-ink">You're all caught up</p>
          <p className="mt-1 text-sm text-compass-slate">
            We'll let you know if there's something worth reviewing.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-compass-line bg-white px-4 py-3"
            >
              <Link to={n.to} className="flex flex-1 items-start gap-3">
                <span aria-hidden="true" className="text-lg leading-none">
                  {kindIcon[n.kind]}
                </span>
                <div>
                  <p className="text-sm font-medium text-compass-ink">{n.title}</p>
                  <p className="text-xs text-compass-slate">{n.body}</p>
                </div>
              </Link>
              <button
                onClick={() => dismiss(n.id)}
                className="text-xs text-compass-slate hover:text-compass-amber"
                aria-label={`Dismiss: ${n.title}`}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
