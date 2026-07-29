import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePolicy } from '../context/PolicyContext.jsx'

function buildCoverageAlertBody(analysis) {
  const topGap = analysis.gaps?.[0]
  if (!topGap) return 'No coverage gaps flagged for your latest policy review.'
  return topGap.status === 'Worth Confirming'
    ? `${topGap.name} is mentioned but worth confirming the details.`
    : `Your policy doesn't show ${topGap.name.toLowerCase()}, worth asking about.`
}

const staticNotifications = [
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

const kindStyles = {
  alert: { bg: 'bg-compass-amberlight', fg: 'text-compass-amber', Icon: BellIcon },
  renewal: { bg: 'bg-compass-skyblue', fg: 'text-compass-link', Icon: CalendarIcon },
  education: { bg: 'bg-compass-skyblue', fg: 'text-compass-link', Icon: BookIcon },
  report: { bg: 'bg-compass-mint', fg: 'text-compass-green', Icon: CheckCircleIcon },
}

const DISMISSED_KEY = 'coverage-compass-dismissed-notifications'

function loadDismissed() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function Notifications() {
  const { analysis } = usePolicy()
  const [dismissed, setDismissed] = useState(loadDismissed)

  const allNotifications = [
    {
      id: 1,
      kind: 'alert',
      title: 'Coverage alert',
      body: buildCoverageAlertBody(analysis),
      to: '/gap-report',
    },
    ...staticNotifications,
  ]
  const items = allNotifications.filter((n) => !dismissed.includes(n.id))

  function dismiss(id) {
    setDismissed((prev) => {
      const next = [...prev, id]
      try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(next))
      } catch {
        // Storage full or unavailable, dismissal still works for this session.
      }
      return next
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
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
          {items.map((n) => {
            const { bg, fg, Icon } = kindStyles[n.kind]
            return (
              <div
                key={n.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-compass-line bg-compass-surface px-4 py-3 transition hover:border-compass-blue hover:shadow-card"
              >
                <Link to={n.to} className="flex flex-1 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ${fg}`}
                  >
                    <Icon />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-compass-ink">{n.title}</p>
                    <p className="text-xs text-compass-slate">{n.body}</p>
                  </div>
                </Link>
                <button
                  onClick={() => dismiss(n.id)}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs text-compass-slate hover:text-compass-amber"
                  aria-label={`Dismiss: ${n.title}`}
                >
                  Dismiss
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 10a6 6 0 1 1 12 0c0 3.2 1 4.8 1.5 5.5H4.5C5 14.8 6 13.2 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-1.5H5V4.5ZM19 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-1.5h6V4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12.2l2.3 2.3 4.2-4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
