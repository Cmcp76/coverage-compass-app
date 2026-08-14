import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { articles } from '../data/mockData.js'
import { localePath } from '../utils/localeRouting.js'

const POLICY_TYPE_TICKER = [
  'AUTO',
  'HOMEOWNERS',
  'RENTERS',
  'GENERAL LIABILITY',
  "WORKERS' COMPENSATION",
  'TRUCKING & MOTOR CARRIER',
]

// "What can we help you with?" - each maps to a real destination. Life
// Insurance isn't a policy type the analysis engine supports (see
// policyDomainKnowledge.js), so it points at the Learning Center's real
// Life Insurance articles instead of implying an AI review that doesn't
// exist for that line yet.
const HELP_CATEGORIES = [
  { icon: 'car', accent: 'blue', title: 'Auto Insurance', body: 'Liability, collision, comprehensive, and the coverage gaps drivers miss most.', cta: 'Review my auto policy', to: '/upload' },
  { icon: 'home', accent: 'teal', title: 'Home Insurance', body: 'Dwelling, personal property, and the actual-cash-value question that trips up claims.', cta: 'Review my home policy', to: '/upload' },
  { icon: 'key', accent: 'purple', title: 'Renters Insurance', body: "What your landlord's policy covers versus what's actually on you.", cta: 'Review my renters policy', to: '/upload' },
  { icon: 'briefcase', accent: 'gold', title: 'Business Insurance', body: 'General liability and workers’ comp, reviewed against what your business actually needs.', cta: 'Review my business policy', to: '/business' },
  { icon: 'truck', accent: 'coral', title: 'Trucking & FMCSA', body: 'A step-by-step checklist for authority, compliance, and motor carrier coverage.', cta: 'Start my trucking checklist', to: '/trucking-startup' },
  { icon: 'heart', accent: 'blue', title: 'Life Insurance', body: 'Term vs. whole life, and the basics everyone should know before they buy.', cta: 'Learn about life insurance', to: '/learning-center' },
  { icon: 'lifebuoy', accent: 'teal', title: 'Claims Help', body: 'A plain-language walkthrough of what to do the moment something happens.', cta: 'Get claims guidance', to: '/claims-help' },
  { icon: 'search', accent: 'purple', title: 'Policy Review', body: "Already have a policy? Upload it for a full plain-language breakdown.", cta: 'Upload for review', to: '/upload' },
]

const HOW_IT_WORKS = [
  { n: '1', title: 'Choose what you need help with', body: 'Pick a line of coverage or a tool, no account required to start.' },
  { n: '2', title: 'Answer a few simple questions', body: 'Or upload a policy directly, whichever is faster for you.' },
  { n: '3', title: 'Review personalized guidance', body: 'Get a plain-language breakdown, a Coverage Score, and gaps worth a second look.' },
  { n: '4', title: 'Take the next step with confidence', body: 'Download a report and walk into your next conversation prepared.' },
]

const FEATURED_TOOLS = [
  { icon: 'sparkles', accent: 'blue', title: 'AI Policy Review', body: 'Upload a policy and get a plain-language breakdown of what it actually covers.', to: '/upload' },
  { icon: 'columns', accent: 'teal', title: 'Coverage Comparison Tool', body: 'Compare two policies side by side to see what actually differs.', to: '/tools' },
  { icon: 'calculator', accent: 'purple', title: 'Insurance Calculators', body: 'See how different deductible levels affect your out-of-pocket costs.', to: '/tools' },
  { icon: 'truck', accent: 'coral', title: 'FMCSA Compliance Checker', body: 'A step-by-step checklist for motor carrier authority and compliance.', to: '/trucking-startup' },
  { icon: 'lifebuoy', accent: 'gold', title: 'Claims Assistant', body: 'Plain-language guidance for what to do when you need to file a claim.', to: '/claims-help' },
  { icon: 'clipboard', accent: 'blue', title: 'Business Insurance Checklist', body: 'Upload your GL or workers’ comp policy for a plain-language review.', to: '/business' },
  { icon: 'book', accent: 'teal', title: 'Insurance Learning Center', body: 'Plain-language guides and a glossary, no policy upload required.', to: '/learning-center' },
]

export default function Landing() {
  const { t } = useTranslation('common')
  const { lang } = useParams()

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-compass-skyblue via-compass-surface to-compass-purpletint">
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full bg-compass-navy px-4 py-2 text-xs font-bold text-white">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-compass-green" aria-hidden="true" />
              FREE EDUCATIONAL REVIEW &middot; NO SALES CALLS
            </span>
            <h1 className="animate-fade-up font-display text-4xl font-bold leading-[1.05] text-compass-heading sm:text-5xl">
              Understand Your Insurance. Find Better Options. Protect What Matters.
            </h1>
            <p className="animate-fade-up animate-fade-up-delay-1 mt-5 max-w-xl text-lg text-compass-slate">
              Coverage Compass gives you simple tools, personalized guidance, and clear
              explanations to help you make smarter insurance decisions.
            </p>
            <div className="animate-fade-up animate-fade-up-delay-2 mt-8 flex flex-wrap items-center gap-4">
              <Link to={localePath(lang, '/upload')} className="btn-primary px-6 py-3 text-base">
                Review My Coverage
              </Link>
              <Link to={localePath(lang, '/tools')} className="btn-secondary px-6 py-3 text-base">
                Explore Insurance Tools
              </Link>
            </div>
            <p className="animate-fade-up animate-fade-up-delay-3 mt-4 text-xs text-compass-slate">
              {t('trust.landingLine')}
            </p>
          </div>

          <div className="animate-fade-up animate-fade-up-delay-2 relative mx-auto w-full max-w-sm">
            <ScorePreviewCard />
          </div>
        </div>
      </section>

      {/* Policy type ticker */}
      <div className="overflow-hidden whitespace-nowrap bg-compass-navy py-3.5" aria-hidden="true">
        <div className="animate-marquee inline-flex gap-12 text-sm font-semibold text-white">
          {[...POLICY_TYPE_TICKER, ...POLICY_TYPE_TICKER].map((label, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 opacity-85">
              {label} <span className="text-compass-gold">&#10022;</span>
            </span>
          ))}
        </div>
      </div>

      {/* What can we help you with */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="tag-neutral">Get Started</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-compass-heading">
            What can we help you with?
          </h2>
          <p className="mt-3 text-compass-slate">
            Pick a line of coverage, and we'll guide you from there.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HELP_CATEGORIES.map((c) => (
            <HelpCard key={c.title} {...c} lang={lang} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-compass-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="tag-neutral">How Coverage Compass Works</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-compass-heading">
              Four steps to actually understanding your coverage
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="card animate-fade-up">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-compass-blue text-sm font-bold text-white">
                  {step.n}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-compass-heading">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-compass-slate">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-compass-line bg-compass-paper px-6 py-4 text-center">
            <span className="tag-review">5-minute path</span>
            <p className="text-sm text-compass-ink">
              Not ready to upload a policy?{' '}
              <Link to={localePath(lang, '/challenge')} state={{ fromApp: true }} className="font-medium text-compass-link hover:underline">
                Take the Coverage Compass Challenge
              </Link>{' '}
              instead, 10 quick questions, no upload required.
            </p>
          </div>
        </div>
      </section>

      {/* Featured tools */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="tag-neutral">Featured Tools</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-compass-heading">
            Every tool you need, in one place
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TOOLS.map((tool) => (
            <ToolCard key={tool.title} {...tool} lang={lang} />
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="bg-compass-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-compass-gold">
              Demonstration
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold">
              Your Coverage Compass Dashboard
            </h2>
            <p className="mt-3 text-white/70">
              Once you upload a policy, everything lives in one place. The cards below use
              sample data to show you what that looks like.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardPreviewCard label="Coverage Score" value="82/100" detail="Sample score across five protection areas." icon="target" />
            <DashboardPreviewCard label="Potential Coverage Gaps" value="3 found" detail="Umbrella, roadside assistance, and identity theft." icon="search" />
            <DashboardPreviewCard label="Savings Opportunities" value="2 to explore" detail="Bundling and a higher deductible option." icon="gold" />
            <DashboardPreviewCard label="Recommended Next Steps" value="Ask about limits" detail="Your liability limits are worth a second look." icon="bulb" />
            <DashboardPreviewCard label="Upcoming Policy Dates" value="Renews in 45 days" detail="A good time to shop and compare." icon="calendar" />
            <Link
              to={localePath(lang, '/dashboard')}
              className="flex flex-col items-start justify-center rounded-2xl border border-white/15 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <span className="font-display text-lg font-semibold text-white">
                See your real dashboard
              </span>
              <span className="mt-2 text-sm text-white/70">
                Upload a policy to replace this sample with your own.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-compass-gold">
                Go to Dashboard <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Educational resources */}
      <section className="bg-compass-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold text-compass-heading">
              From the Learning Center
            </h2>
            <Link to={localePath(lang, '/learning-center')} className="text-sm font-semibold text-compass-link hover:underline">
              Browse all articles &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {articles.slice(0, 4).map((a) => (
              <Link
                key={a.title}
                to={localePath(lang, '/learning-center')}
                className="card block transition hover:border-compass-blue"
              >
                <span className="tag-neutral">{a.category}</span>
                <p className="mt-3 text-sm font-medium leading-snug text-compass-ink">
                  {a.title}
                </p>
                <p className="mt-2 text-xs text-compass-slate">{a.readTime}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust and privacy */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-3xl border border-compass-line bg-compass-paper p-8 sm:p-10">
          <span className="tag-neutral">Trust &amp; Compliance</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
            What Coverage Compass is, and isn't
          </h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-compass-ink">
            <li className="flex gap-3">
              <CheckIcon />
              Coverage Compass is an independent insurance education and comparison
              platform, not an insurance company, agency, or broker.
            </li>
            <li className="flex gap-3">
              <CheckIcon />
              We provide educational information and guidance. Insurance availability and
              pricing vary by state, carrier, applicant, and risk.
            </li>
            <li className="flex gap-3">
              <CheckIcon />
              Coverage Compass does not bind, cancel, or modify insurance policies.
            </li>
            <li className="flex gap-3">
              <CheckIcon />
              Always verify final coverage details with a licensed insurance professional
              or insurance carrier.
            </li>
            <li className="flex gap-3">
              <CheckIcon />
              Your document is read entirely in your browser and never uploaded to a
              server. Nothing is sold or shared with third parties.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-2xl font-semibold text-compass-heading">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-4">
          <FaqItem
            q="Is Coverage Compass an insurance company?"
            a="No. Coverage Compass is an independent educational platform. We don't sell insurance, bind coverage, or represent any single carrier."
          />
          <FaqItem
            q="Can Coverage Compass replace my insurance agent?"
            a="No. Coverage Compass helps you understand your policy so your conversations with a licensed insurance professional are more productive, it's a starting point, not a substitute for licensed advice."
          />
          <FaqItem
            q="Is my policy information secure?"
            a="Your document is read entirely in your browser and never uploaded to a server, and nothing is sold or shared with third parties. This prototype does save your review in your browser's local storage (not encrypted) so you can return to it, so avoid uploading real sensitive documents on a shared or public computer."
          />
          <FaqItem
            q="What types of policies can I upload?"
            a="Auto (personal and commercial), homeowners, renters, general liability, workers' compensation, and trucking/motor carrier policies."
          />
          <FaqItem
            q="Does Coverage Compass guarantee my coverage is adequate?"
            a="No. Coverage Compass provides educational information only. Only a licensed insurance professional can advise on and bind actual coverage decisions."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-compass-blue to-compass-purple px-8 py-12 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-bold">
              Ready to actually understand what you're paying for?
            </h3>
            <p className="mt-2 text-sm text-white/80">
              Free educational review, Coverage Score, and questions to ask your agent.
            </p>
          </div>
          <Link
            to={localePath(lang, '/upload')}
            className="shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-compass-navy shadow-lift transition hover:bg-compass-paper"
          >
            Review My Coverage
          </Link>
        </div>
      </section>
    </div>
  )
}

const ACCENT_CLASSES = {
  blue: 'bg-compass-skyblue text-compass-link',
  teal: 'bg-compass-tealtint text-compass-teal',
  purple: 'bg-compass-purpletint text-compass-purple',
  gold: 'bg-compass-goldtint text-compass-gold',
  coral: 'bg-compass-coraltint text-compass-coral',
}

function HelpCard({ icon, accent, title, body, cta, to, lang }) {
  return (
    <Link
      to={localePath(lang, to)}
      className="card group flex flex-col transition hover:-translate-y-1 hover:shadow-lift"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENT_CLASSES[accent]}`}>
        <Icon name={icon} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-compass-heading">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-compass-slate">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-compass-link">
        {cta} <ArrowIcon />
      </span>
    </Link>
  )
}

function ToolCard({ icon, accent, title, body, to, lang }) {
  return (
    <Link
      to={localePath(lang, to)}
      className="card group flex items-start gap-4 transition hover:-translate-y-1 hover:shadow-lift"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}>
        <Icon name={icon} />
      </span>
      <div>
        <h3 className="font-display text-base font-semibold text-compass-heading">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-compass-slate">{body}</p>
      </div>
    </Link>
  )
}

function DashboardPreviewCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-compass-gold">
        <Icon name={icon} />
      </span>
      <p className="mt-4 text-xs uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/60">{detail}</p>
    </div>
  )
}

function ScorePreviewCard() {
  const score = 82
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - score / 100)
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-compass-ink">Coverage Score preview</p>
        <span className="tag-neutral">Sample</span>
      </div>
      <div className="relative mx-auto mt-4 flex h-36 w-36 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" strokeWidth="10" className="stroke-compass-line" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-compass-blue"
          />
        </svg>
        <div className="absolute text-center">
          <p className="font-display text-3xl font-bold text-compass-heading">{score}</p>
          <p className="text-xs text-compass-slate">out of 100</p>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-compass-slate">
        Upload your policy to see your real Coverage Score, an educational snapshot, not a
        guarantee.
      </p>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <details className="group rounded-lg border border-compass-line bg-compass-surface p-5">
      <summary className="cursor-pointer list-none font-medium text-compass-ink marker:content-none">
        <span className="flex items-center justify-between">
          {q}
          <span className="text-compass-link transition group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">{a}</p>
    </details>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-compass-green">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  )
}

// Shared line-icon set used across category cards, tool cards, and the
// dashboard preview - hand-rolled (no icon library dependency), always
// `currentColor` so each usage inherits its own accent color.
function Icon({ name }) {
  const common = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'car':
      return (
        <svg {...common}>
          <path d="M4 16V11l2-5h12l2 5v5" />
          <path d="M4 16h16" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </svg>
      )
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11l8-7 8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      )
    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="M11 12l9-9M17 6l3 3M14 9l2.5 2.5" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      )
    case 'truck':
      return (
        <svg {...common}>
          <path d="M3 7h11v9H3z" />
          <path d="M14 11h4l3 3v2h-7z" />
          <circle cx="7.5" cy="18" r="1.6" />
          <circle cx="17.5" cy="18" r="1.6" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9z" />
        </svg>
      )
    case 'lifebuoy':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M5.6 5.6l3.3 3.3M18.4 5.6l-3.3 3.3M5.6 18.4l3.3-3.3M18.4 18.4l-3.3-3.3" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.8-4.8" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
      )
    case 'columns':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="16" rx="1.5" />
          <rect x="13" y="4" width="7" height="10" rx="1.5" />
        </svg>
      )
    case 'calculator':
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
      )
    case 'clipboard':
      return (
        <svg {...common}>
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <rect x="9" y="2.5" width="6" height="3" rx="1" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5z" />
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5z" />
        </svg>
      )
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        </svg>
      )
    case 'gold':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M9.5 9.3c0-1.3 1.1-2.3 2.5-2.3s2.5 1 2.5 2.1-1.1 1.7-2.5 2-2.5 .9-2.5 2 1.1 2.1 2.5 2.1 2.5-1 2.5-2.3" />
        </svg>
      )
    case 'bulb':
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.4 10.9c.5.4.9 1 .9 1.6V16h5v-.5c0-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      )
    default:
      return null
  }
}
