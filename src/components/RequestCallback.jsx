import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const timeOptions = ['Morning', 'Afternoon', 'Evening']

export default function RequestCallback({ ctaLabel = 'Request a Callback', ctaVariant = 'secondary' }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [time, setTime] = useState(timeOptions[0])

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="card">
      <p className="text-sm font-medium text-compass-ink">
        Want a Licensed Professional&rsquo;s Take on This?
      </p>
      <p className="mt-1 text-xs text-compass-slate">
        If any of the areas above caught your eye, a short conversation with a
        licensed insurance professional can clarify what actually makes sense for
        your situation, no pressure, no obligation.
      </p>

      {submitted ? (
        <div role="status" className="mt-4 rounded-lg bg-compass-mint p-4">
          <p className="text-sm font-medium text-compass-green">Request received</p>
          <p className="mt-1 text-xs text-compass-ink">
            In a live version of Coverage Compass, this would connect you with a
            licensed professional in your area. This is a prototype, so no request
            was actually sent and no one will be calling you.
          </p>
        </div>
      ) : open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-compass-slate">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-compass-slate">
              Phone or email
            </span>
            <input
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-compass-slate">
              Best time to reach you
            </span>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
            >
              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              Submit Request
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {t('buttons.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          className={`${ctaVariant === 'primary' ? 'btn-primary' : 'btn-secondary'} mt-4`}
          onClick={() => setOpen(true)}
        >
          {ctaLabel}
        </button>
      )}

      <p className="disclaimer mt-4">
        Coverage Compass does not sell insurance and is not compensated for this
        prototype request form. A real version of this feature would connect you with
        an independent, licensed insurance professional, never a specific carrier.
      </p>
    </div>
  )
}
