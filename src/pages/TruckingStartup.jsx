import { useState, useEffect, useMemo } from 'react'

/**
 * Start My Trucking Company — a step-by-step checklist for a new or growing
 * motor carrier: business formation, FMCSA authority, driver/vehicle
 * compliance, and an interactive "what insurance do I need" guide keyed off
 * the operation type. Progress is saved to localStorage, no backend.
 */

const SECTIONS = [
  {
    id: 'business-formation',
    title: 'Business Formation',
    blurb: 'Set up the legal entity your trucking authority will sit under.',
    items: [
      {
        id: 'choose-entity',
        title: 'Choose your business structure (LLC recommended)',
        explainer:
          "Most owner-operators and small fleets form an LLC. It separates your personal assets (house, personal savings) from business liabilities and is simpler to run than a corporation. A single-member LLC is usually enough to start.",
        link: { label: 'Compare business structures (SBA)', href: 'https://www.sba.gov/business-guide/launch-your-business/choose-business-structure' },
      },
      {
        id: 'register-llc',
        title: 'Register your LLC with your state',
        explainer:
          "File Articles of Organization with your Secretary of State's office. This is where your company legally comes into existence — you'll need this before you can apply for an EIN or FMCSA authority.",
        link: { label: "Find your state's filing office", href: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business' },
      },
      {
        id: 'ein',
        title: 'Get your EIN (Employer Identification Number)',
        explainer:
          'Your EIN is the business version of a Social Security Number. The IRS issues it for free, in minutes, online. FMCSA, your bank, and your insurance carrier will all ask for it.',
        link: { label: 'Apply for an EIN (IRS.gov)', href: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online' },
      },
      {
        id: 'business-bank',
        title: 'Open a business bank account',
        explainer:
          "Keep business and personal money separate from day one. This protects your LLC's liability shield and makes bookkeeping (and factoring, if you use it) far easier.",
      },
    ],
  },
  {
    id: 'fmcsa-authority',
    title: 'FMCSA Authority Setup',
    blurb: 'Get legally authorized to operate as a motor carrier.',
    items: [
      {
        id: 'usdot',
        title: 'Register for a USDOT Number',
        explainer:
          "Your USDOT Number identifies your company to FMCSA and state safety regulators. Almost every commercial carrier needs one before operating — it's the foundation everything else attaches to.",
        link: { label: 'Register in URS (FMCSA)', href: 'https://www.fmcsa.dot.gov/registration/how-do-i-obtain-usdot-number' },
      },
      {
        id: 'mc-authority',
        title: 'Apply for MC Authority (Operating Authority)',
        explainer:
          "Your USDOT Number says who you are; MC Authority says what you're allowed to haul and for whom (for-hire freight, household goods, brokering, etc). Most for-hire carriers need both.",
        link: { label: 'Apply for Operating Authority (URS)', href: 'https://www.fmcsa.dot.gov/registration/operating-authority-mc-number' },
      },
      {
        id: 'boc3',
        title: 'File a BOC-3 (Process Agent Designation)',
        explainer:
          "A BOC-3 names a legal process agent in every state you operate in, so lawsuits can be served on your business. FMCSA won't activate your authority without one — a licensed BOC-3 filing service can file this for a small fee within a day.",
        link: { label: 'Find BOC-3 filing services', href: 'https://www.fmcsa.dot.gov/registration/boc-3-process-agent' },
      },
      {
        id: 'ucr',
        title: 'Register for UCR (Unified Carrier Registration)',
        explainer:
          'UCR is an annual registration and fee (based on fleet size) required for interstate carriers, brokers, and freight forwarders. It funds state enforcement programs.',
        recurring: 'Annual — renews each December for the following year',
        link: { label: 'Register for UCR', href: 'https://www.ucr.gov/' },
      },
      {
        id: 'new-entrant-audit',
        title: 'Prepare for your New Entrant Safety Audit',
        explainer:
          'New carriers get audited within the first 12 months of receiving authority. FMCSA checks your DQ files, drug & alcohol program, hours-of-service records, and vehicle maintenance records. Passing keeps your authority active; failing can lead to revocation.',
        link: { label: 'New Entrant Safety Assurance Program', href: 'https://www.fmcsa.dot.gov/registration/new-entrant-safety-assurance-program' },
      },
    ],
  },
  {
    id: 'state-registrations',
    title: 'State & Interstate Registrations',
    blurb: 'Additional registrations that depend on where and how you operate.',
    items: [
      {
        id: 'irp',
        title: 'IRP (International Registration Plan) — if operating in multiple states',
        explainer:
          'IRP lets you register a truck once and operate across participating states/provinces, with registration fees apportioned based on miles driven in each. Required if you run interstate with a qualifying vehicle (generally 26,001+ lbs or 3+ axles).',
        link: { label: 'IRP overview', href: 'https://www.irponline.org/' },
      },
      {
        id: 'ifta',
        title: 'IFTA (International Fuel Tax Agreement) — if operating in multiple states',
        explainer:
          'IFTA simplifies fuel tax reporting for carriers running in more than one member jurisdiction. You file one quarterly return with your base state instead of separate returns everywhere you bought fuel or drove.',
        recurring: 'Quarterly filing',
        link: { label: 'IFTA overview', href: 'https://www.iftach.org/' },
      },
      {
        id: 'state-permits',
        title: 'Check state-specific permits (oversize/overweight, intrastate authority, etc.)',
        explainer:
          'Some states require additional intrastate authority, weight-distance taxes (e.g. NY HUT, KY KYU, NM WDT, OR weight-mile tax), or permits for oversize/overweight loads. These vary by state and by what you haul.',
      },
    ],
  },
  {
    id: 'drivers-safety',
    title: 'Driver & Safety Compliance',
    blurb: 'The federally required programs that keep your drivers — and your authority — legal.',
    items: [
      {
        id: 'consortium',
        title: 'Enroll in a Drug & Alcohol Testing Consortium',
        explainer:
          'FMCSA requires pre-employment, random, post-accident, and reasonable-suspicion drug and alcohol testing for any driver operating a CMV requiring a CDL. A consortium is the easiest way for small carriers to meet the random testing rate requirement.',
        link: { label: 'Drug & Alcohol Testing Requirements', href: 'https://www.fmcsa.dot.gov/regulations/drug-alcohol-testing' },
      },
      {
        id: 'clearinghouse',
        title: 'Register with the FMCSA Drug & Alcohol Clearinghouse',
        explainer:
          'The Clearinghouse is a database of drug and alcohol program violations. Employers must query it before hiring a driver and annually for current drivers — and must report their own violations.',
        recurring: 'Annual query required for each active driver',
        link: { label: 'Clearinghouse registration', href: 'https://clearinghouse.fmcsa.dot.gov/' },
      },
      {
        id: 'dq-file',
        title: "Build each driver's Driver Qualification (DQ) file",
        explainer:
          "Every CDL driver needs a DQ file containing: application for employment, motor vehicle record (MVR), road test certificate or CDL equivalent, medical examiner's certificate, annual review of driving record, and safety performance history from previous employers.",
        recurring: 'Annual review of driving record + medical card renewal (typically every 1–2 years)',
        link: { label: 'DQ file checklist (FMCSA)', href: 'https://www.fmcsa.dot.gov/regulations/driver-safety/driver-qualification-file' },
      },
      {
        id: 'hos-eld',
        title: 'Set up Hours of Service (HOS) tracking with an ELD',
        explainer:
          "Most drivers must log hours electronically using an FMCSA-registered Electronic Logging Device. HOS rules limit daily/weekly driving time to reduce fatigue-related crashes. Confirm your ELD is on FMCSA's registered device list.",
        link: { label: 'ELD requirements', href: 'https://www.fmcsa.dot.gov/hours-service/elds' },
      },
    ],
  },
  {
    id: 'vehicle-compliance',
    title: 'Vehicle Compliance',
    blurb: 'Keep your equipment inspection-ready and roadworthy.',
    items: [
      {
        id: 'annual-inspection',
        title: 'Schedule required annual vehicle inspections',
        explainer:
          'Every CMV needs a documented annual inspection (brakes, steering, tires, lights, coupling devices, and more) by a qualified inspector. Keep the inspection report in the vehicle or readily available.',
        recurring: 'Annual, per vehicle',
        link: { label: 'Vehicle inspection standards', href: 'https://www.fmcsa.dot.gov/regulations/title49/section/396.17' },
      },
      {
        id: 'maintenance-records',
        title: 'Set up a preventive maintenance and repair record system',
        explainer:
          'Carriers must systematically inspect, repair, and maintain vehicles, and keep maintenance records for each unit. A simple spreadsheet or fleet maintenance app is fine to start — auditors will ask for this.',
      },
      {
        id: 'pretrip',
        title: 'Establish a driver pre-trip / post-trip inspection routine',
        explainer:
          'Drivers must inspect their vehicle before and after each trip (DVIR — Driver Vehicle Inspection Report) and note any defects that could affect safety.',
      },
    ],
  },
  {
    id: 'insurance',
    title: 'Required Insurance',
    blurb: 'Coverage is driven by what you haul, how you operate, and your authority type — see the guidance tool below.',
    items: [
      {
        id: 'auto-liability',
        title: 'Commercial Auto Liability (BMC-91/91X filing)',
        explainer:
          'FMCSA requires minimum liability coverage — $750,000 for most general freight, up to $5,000,000 for hazmat, oil, or certain hazardous cargo. Your insurer files proof directly with FMCSA (Form BMC-91 or BMC-91X).',
        link: { label: 'FMCSA minimum insurance requirements', href: 'https://www.fmcsa.dot.gov/registration/insurance-filings' },
      },
      {
        id: 'cargo',
        title: 'Motor Truck Cargo coverage',
        explainer:
          "Covers freight in your care, custody, and control if it's lost or damaged in transit. Shippers and brokers typically require proof before they'll tender loads to you — commonly $100,000 as a baseline, more for high-value freight.",
      },
      {
        id: 'physical-damage',
        title: 'Physical Damage (comprehensive & collision) on trucks and trailers',
        explainer:
          'Covers your own equipment for collision, fire, theft, and weather damage. Optional under FMCSA rules but usually required if your equipment is financed or leased.',
      },
      {
        id: 'non-trucking-liability',
        title: 'Non-Trucking Liability (Bobtail) — for leased owner-operators',
        explainer:
          "If you lease onto a carrier, their policy generally covers you while dispatched under their authority. Non-trucking/bobtail liability covers you when you're driving the truck for personal use or between dispatches, not under their authority.",
      },
      {
        id: 'general-liability-wc',
        title: "General Liability & Workers' Compensation (if you have employees or a yard/warehouse)",
        explainer:
          "General Liability covers third-party injury/property damage not related to auto use (e.g., at a loading dock or yard). Workers' Comp is required in nearly every state once you have employees — even one W-2 driver.",
      },
    ],
  },
]

// Simple operation → recommended coverage mapping for the interactive tool below.
const CARGO_PROFILES = {
  general: {
    label: 'General freight / dry van',
    coverages: ['Commercial Auto Liability ($750,000 minimum)', 'Motor Truck Cargo ($100,000+)', 'Physical Damage', 'Non-Trucking Liability if leased on'],
  },
  hazmat: {
    label: 'Hazardous materials',
    coverages: ['Commercial Auto Liability ($1,000,000–$5,000,000 depending on class)', 'Motor Truck Cargo (higher limits, hazmat-specific)', 'Physical Damage', 'Pollution/Environmental Liability — worth confirming'],
  },
  household: {
    label: 'Household goods moving',
    coverages: ['Commercial Auto Liability ($300,000–$750,000)', 'Cargo coverage for household goods (often higher limits, replacement-cost basis)', 'Physical Damage', 'General Liability for in-home work'],
  },
  refrigerated: {
    label: 'Refrigerated / perishable freight',
    coverages: ['Commercial Auto Liability ($750,000 minimum)', 'Motor Truck Cargo with reefer breakdown / spoilage coverage', 'Physical Damage (including reefer unit)', 'Non-Trucking Liability if leased on'],
  },
  owner_operator_leased: {
    label: 'Owner-operator leased to a carrier',
    coverages: ["Non-Trucking (Bobtail) Liability", 'Physical Damage if truck is financed', "Occupational Accident or Workers' Comp (check your lease agreement)", 'Confirm cargo/auto liability is provided by the carrier you’re leased to'],
  },
}

function CheckIcon({ className = 'h-3 w-3' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  )
}

function ChevronIcon({ open, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`${className} transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M5.2 7.3a1 1 0 011.4 0L10 10.8l3.4-3.5a1 1 0 111.4 1.4l-4 4.2a1 1 0 01-1.4 0l-4.1-4.2a1 1 0 010-1.4z" clipRule="evenodd" />
    </svg>
  )
}

function ExternalLinkIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.3 3a1 1 0 100 2h2.3l-6.9 6.9a1 1 0 101.4 1.4L16 6.4v2.3a1 1 0 102 0V4a1 1 0 00-1-1h-4.7z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
    </svg>
  )
}

const STORAGE_KEY = 'coverage-compass-trucking-checklist'

function loadCompleted() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export default function TruckingStartup() {
  const [completed, setCompleted] = useState(loadCompleted)
  const [openSections, setOpenSections] = useState(() => new Set([SECTIONS[0].id]))
  const [openExplainer, setOpenExplainer] = useState(null)
  const [cargoProfile, setCargoProfile] = useState('general')

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
    } catch {
      // Storage unavailable, progress just won't persist across reloads.
    }
  }, [completed])

  const allItems = useMemo(() => SECTIONS.flatMap((s) => s.items), [])
  const totalCount = allItems.length
  const completedCount = allItems.filter((i) => completed[i.id]).length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const recurringOpen = allItems.filter((i) => i.recurring && !completed[i.id])

  function toggleItem(id) {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-compass-green">
          Coverage Compass &middot; Trucking
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-compass-heading">
          Start My Trucking Company
        </h1>
        <p className="mt-2 max-w-2xl text-compass-slate">
          A step-by-step path to setting up your motor carrier business correctly from day
          one — business formation, FMCSA authority, driver and vehicle compliance, and the
          insurance coverage that matches how you actually operate.
        </p>
      </div>

      {/* Compliance dashboard */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-compass-ink">Compliance Dashboard</h2>
            <p className="text-sm text-compass-slate">
              {completedCount} of {totalCount} steps complete
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-40 overflow-hidden rounded-full bg-compass-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-compass-blue to-compass-green transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-compass-ink">{percent}%</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-compass-line bg-compass-mint p-4">
            <p className="font-display text-2xl font-bold text-compass-green">{completedCount}</p>
            <p className="text-sm text-compass-ink">Complete</p>
          </div>
          <div className="rounded-xl border border-compass-line bg-compass-amberlight p-4">
            <p className="font-display text-2xl font-bold text-compass-amber">
              {totalCount - completedCount}
            </p>
            <p className="text-sm text-compass-ink">Still needed</p>
          </div>
          <div className="rounded-xl border border-compass-line bg-compass-skyblue p-4">
            <p className="font-display text-2xl font-bold text-compass-link">{recurringOpen.length}</p>
            <p className="text-sm text-compass-ink">Recurring items to schedule</p>
          </div>
        </div>

        <p className="disclaimer mt-4">
          This dashboard reflects your own checklist progress. It's an organizational tool, not
          a substitute for FMCSA's official compliance review of your operation.
        </p>
      </div>

      {/* Checklist sections */}
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const sectionDone = section.items.filter((i) => completed[i.id]).length
          const isOpen = openSections.has(section.id)
          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-compass-line bg-compass-surface shadow-card">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-compass-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue focus-visible:ring-inset"
              >
                <div>
                  <h3 className="font-semibold text-compass-ink">{section.title}</h3>
                  <p className="text-sm text-compass-slate">{section.blurb}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-medium text-compass-slate">
                    {sectionDone}/{section.items.length}
                  </span>
                  <ChevronIcon open={isOpen} className="h-5 w-5 text-compass-slate" />
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-compass-line border-t border-compass-line">
                  {section.items.map((item) => {
                    const isDone = !!completed[item.id]
                    const explainerOpen = openExplainer === item.id
                    return (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-pressed={isDone}
                            aria-label={`Mark "${item.title}" ${isDone ? 'incomplete' : 'complete'}`}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue focus-visible:ring-offset-2 ${
                              isDone
                                ? 'border-compass-green bg-compass-green text-white'
                                : 'border-compass-line text-transparent hover:border-compass-green'
                            }`}
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-medium ${
                                isDone ? 'text-compass-slate line-through' : 'text-compass-ink'
                              }`}
                            >
                              {item.title}
                            </p>

                            {item.recurring && (
                              <span className="mt-1 inline-block rounded-full bg-compass-skyblue px-2 py-0.5 text-xs font-medium text-compass-link">
                                Recurring &middot; {item.recurring}
                              </span>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                              <button
                                type="button"
                                onClick={() => setOpenExplainer(explainerOpen ? null : item.id)}
                                aria-expanded={explainerOpen}
                                className="font-medium text-compass-green hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
                              >
                                {explainerOpen ? 'Hide explanation' : 'Explain this in plain English'}
                              </button>
                              {item.link && (
                                <a
                                  href={item.link.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-compass-link hover:underline"
                                >
                                  {item.link.label} <ExternalLinkIcon />
                                </a>
                              )}
                            </div>

                            {explainerOpen && (
                              <p className="mt-2 rounded-lg border border-compass-line bg-compass-paper p-3 text-sm text-compass-slate">
                                {item.explainer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Insurance guidance tool */}
      <div className="card">
        <h2 className="font-semibold text-compass-ink">What insurance do I need?</h2>
        <p className="mt-1 text-sm text-compass-slate">
          Select your operation type for a starting-point view of the coverages that commonly
          apply. This is educational only — your specific limits depend on your authority type,
          states of operation, and contracts with shippers or brokers.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(CARGO_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCargoProfile(key)}
              aria-pressed={cargoProfile === key}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                cargoProfile === key
                  ? 'bg-compass-blue text-white'
                  : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
              }`}
            >
              {profile.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {CARGO_PROFILES[cargoProfile].coverages.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-compass-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-compass-green" />
              {c}
            </li>
          ))}
        </ul>

        <p className="disclaimer mt-4">
          Coverage Compass provides this as general educational guidance, not a quote or a
          binding recommendation. Talk to a licensed insurance professional to confirm the right
          limits and endorsements for your operation.
        </p>
      </div>

      <p className="disclaimer">
        This section is an educational checklist to help you organize your trucking company
        setup. It is not legal, tax, or compliance advice, and does not guarantee approval of
        any FMCSA filing or passage of any safety audit. Verify current requirements at
        fmcsa.dot.gov and consult an attorney, accountant, or licensed insurance professional
        for guidance specific to your business.
      </p>
    </div>
  )
}
