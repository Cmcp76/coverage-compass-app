import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { articles } from '../data/mockData.js'
import { localePath } from '../utils/localeRouting.js'
import Cece from '../components/Cece.jsx'

// Hosted externally (not committed to this repo) - one photo per line of
// business for the "Lines of Business" section below.
const SERVICE_IMG_AUTO = 'https://i.postimg.cc/HjRbRBwY/Chat-GPT-Image-Aug-13-2026-11-25-21-AM.png'
const SERVICE_IMG_HOMEOWNERS = 'https://i.postimg.cc/S26NdLpf/Chat-GPT-Image-Aug-13-2026-01-44-39-PM-(4).png'
const SERVICE_IMG_RENTERS_CONDO = 'https://i.postimg.cc/WqspHD2K/Chat-GPT-Image-Aug-13-2026-01-44-39-PM-(5).png'
const SERVICE_IMG_LANDLORD = 'https://i.postimg.cc/qhsMwcdX/Chat-GPT-Image-Aug-13-2026-01-44-40-PM-(10).png'
const SERVICE_IMG_COMMERCIAL_GL = 'https://i.postimg.cc/2bQ8Gdfx/Chat-GPT-Image-Aug-13-2026-01-44-40-PM-(7).png'
const SERVICE_IMG_WORKERS_COMP = 'https://i.postimg.cc/VrqLg9cR/Chat-GPT-Image-Aug-13-2026-01-44-40-PM-(8).png'
const SERVICE_IMG_TRUCKING = 'https://i.postimg.cc/w1MMzshB/Chat-GPT-Image-Aug-13-2026-01-44-40-PM-(9).png'

// Mapped to lines of business by upload order as a first pass - if any
// image doesn't match its labeled coverage line, just swap the constant
// it's assigned to here, nothing else needs to change.
const services = [
  {
    key: 'auto',
    title: 'Personal & Commercial Auto',
    body: 'Liability, UM/UIM, comprehensive, collision, medpay, and rental reimbursement, explained in plain language.',
    img: SERVICE_IMG_AUTO,
  },
  {
    key: 'home',
    title: 'Homeowners',
    body: 'Dwelling, other structures, personal property, loss of use, and the ACV-vs-replacement-cost question that trips up most claims.',
    img: SERVICE_IMG_HOMEOWNERS,
  },
  {
    key: 'renters',
    title: 'Renters & Condo',
    body: "What your landlord's policy covers versus what's on you, personal property, liability, and additional living expenses.",
    img: SERVICE_IMG_RENTERS_CONDO,
  },
  {
    key: 'landlord',
    title: 'Landlord',
    body: 'Rental dwelling, loss of rents, and liability exposure specific to tenant-occupied property.',
    img: SERVICE_IMG_LANDLORD,
  },
  {
    key: 'commercial',
    title: 'Commercial General Liability',
    body: 'Premises, products, completed operations, additional insured language, and certificate-of-insurance requirements.',
    img: SERVICE_IMG_COMMERCIAL_GL,
  },
  {
    key: 'workerscomp',
    title: "Workers' Compensation",
    body: 'Payroll exposure, class codes, experience mod, and owner-vs-employee coverage questions.',
    img: SERVICE_IMG_WORKERS_COMP,
  },
  {
    key: 'trucking',
    title: 'Trucking & Motor Carrier',
    body: 'USDOT, MC authority, cargo, bobtail, non-trucking liability, and FMCSA compliance basics.',
    img: SERVICE_IMG_TRUCKING,
  },
]

export default function Landing() {
  const { t } = useTranslation('common')
  const { lang } = useParams()
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-compass-skyblue">
        <HeroBackdrop />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="animate-fade-up font-display text-4xl font-semibold leading-tight text-compass-heading sm:text-5xl">
            Understand Your Coverage. Protect What Matters.
          </h1>
          <p className="animate-fade-up animate-fade-up-delay-1 mx-auto mt-5 max-w-2xl text-lg text-compass-slate">
            Coverage Compass turns your insurance policy into plain language, so you
            know what you have, what might be missing, and what to ask before you're
            ever filing a claim.
          </p>
          <div className="animate-fade-up animate-fade-up-delay-2 mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to={localePath(lang, '/upload')} className="btn-primary px-6 py-3 text-base">
              {t('buttons.uploadYourPolicy')}
            </Link>
            <Link to={localePath(lang, '/learning-center')} className="btn-secondary px-6 py-3 text-base">
              {t('buttons.learnAboutInsurance')}
            </Link>
          </div>
          <p className="animate-fade-up animate-fade-up-delay-3 mt-4 text-xs text-compass-slate">
            {t('trust.landingLine')}
          </p>
          <div className="animate-fade-up animate-fade-up-delay-3 mt-8 flex justify-center">
            <Cece
              state="welcome"
              size="lg"
              message="Hi, I'm Cece — I'll walk you through your policy in plain language."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-compass-heading">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <StepCard
            step="1"
            title={t('buttons.uploadYourPolicy')}
            body="Drop in your declarations page, ACORD form, or full policy, auto, homeowners, renters, general liability, workers' compensation, or trucking/motor carrier. PDF or text file works best."
            delay={0}
          />
          <StepCard
            step="2"
            title="Get a Plain-Language Review"
            body="We read through the document and translate the jargon into a summary anyone can understand: what's covered, your limits, and where there might be gaps worth a second look."
            delay={1}
          />
          <StepCard
            step="3"
            title="Walk Into Your Next Conversation Prepared"
            body="Download a clean report with your coverage summary and smart questions to ask a licensed insurance professional."
            delay={2}
          />
        </div>
      </section>

      {/* Coverage Compass Challenge */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl border border-compass-line bg-compass-paper px-6 py-10 text-center sm:px-12">
          <span className="tag-neutral">5-minute challenge</span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-compass-heading">
            Not ready to upload a policy yet? Take the Coverage Compass Challenge.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-compass-slate">
            Answer 10 quick questions about auto, home, and everyday coverage and get an
            educational Coverage Compass Score, no policy upload required.
          </p>
          <Link to={localePath(lang, '/challenge')} className="btn-primary mt-6 inline-flex px-6 py-3 text-base">
            Start the Challenge
          </Link>
        </div>
      </section>

      {/* Why Coverage Compass */}
      <section className="bg-compass-surface py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-2xl font-semibold text-compass-heading">
            Insurance shouldn't feel like a foreign language.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-compass-slate">
            Most people sign their policy, file it away, and never really understand
            what's in it, until something goes wrong. Coverage Compass exists to close
            that gap before it matters: no sales pitch, no pressure, just a clear
            picture of your coverage.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Plain language, not fine print"
              body="Every policy term gets explained the way a knowledgeable friend would explain it."
            />
            <FeatureCard
              title="Educational, not transactional"
              body="We don't sell policies or push carriers. We help you understand what you already have."
            />
            <FeatureCard
              title="Built for real coverage"
              body="Auto, homeowners, renters, general liability, workers' compensation, and trucking policies, each reviewed against the details that actually matter for that line of business."
            />
          </div>
        </div>
      </section>

      {/* Lines of Business */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="tag-neutral">What we help you understand</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-compass-heading">
            Every line of business, one plain-language review
          </h2>
          <p className="mt-3 text-sm text-compass-slate">
            Coverage Compass reviews the policies real people and small businesses
            actually carry, not just auto.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.key} title={s.title} body={s.body} img={s.img} />
          ))}
          <div className="flex flex-col items-start justify-center rounded-2xl bg-compass-navy p-6 text-white">
            <h3 className="font-display text-lg font-semibold">
              Don't see your policy type?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Upload it anyway, Cece will tell you clearly if something's outside
              what she can review yet.
            </p>
            <Link
              to={localePath(lang, '/upload')}
              className="mt-5 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              Upload Your Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Meet Cece */}
      <section className="bg-compass-blue/5 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
          <Cece state="teaching" size="2xl" showBubble={false} />
          <h2 className="font-display text-2xl font-semibold text-compass-heading">
            Meet Cece, your Coverage Compass guide
          </h2>
          <p className="max-w-2xl text-compass-slate">
            Cece walks alongside you while you upload and review your policy, calling
            out what each section means and flagging the details worth a second look.
            She's an AI education guide, not a licensed insurance agent, broker, or
            advisor, so think of her as a knowledgeable friend explaining the fine
            print, not someone selling you a policy.
          </p>
          <Link
            to={localePath(lang, '/upload')}
            className="rounded-full bg-compass-blue px-6 py-3 font-semibold text-white shadow-card transition hover:bg-compass-blue/90"
          >
            Upload a policy and meet Cece
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-compass-heading">
          What people are saying
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Testimonial
            quote="I finally understood what actual cash value actually meant for my roof claim, before I ever needed to file one."
            attribution="Homeowner, Coverage Compass user"
          />
          <Testimonial
            quote="As a small business owner, I had no idea my GL policy didn't include the additional insured language my landlord required."
            attribution="Small business owner"
          />
          <Testimonial
            quote="It's like Credit Karma, but for my insurance policy. I actually get it now."
            attribution="Renter, Coverage Compass user"
          />
        </div>
        <p className="mt-4 text-center text-xs text-compass-slate">
          Sample quotes for prototype purposes, replace with real, permissioned
          testimonials before launch.
        </p>
      </section>

      {/* Featured articles */}
      <section className="bg-compass-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-compass-heading">
            Featured education articles
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-4">
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

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
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

      {/* Bottom CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-compass-navy px-8 py-12 text-center text-white sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-semibold">
              Ready to see your own policy in plain language?
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Free educational review, Coverage Score, and questions to ask your agent.
            </p>
          </div>
          <Link
            to={localePath(lang, '/upload')}
            className="shrink-0 rounded-full bg-compass-blue px-6 py-3 font-semibold text-white shadow-card transition hover:bg-compass-blue/90"
          >
            {t('buttons.uploadYourPolicy')}
          </Link>
        </div>
      </section>
    </div>
  )
}

// Hosted externally (not committed to this repo) - the Coverage Compass
// badge artwork used inside the hero's circular emblems.
const HERO_COMPASS_IMAGE_URL = 'https://i.postimg.cc/hGF570Hk/Chat-GPT-Image-Aug-13-2026-10-59-36-AM.png'

function CompassEmblem({ cx, cy, r }) {
  const clipId = `heroCompassClip-${cx}-${cy}`
  return (
    <g filter="url(#heroCompassDepth)">
      <ellipse cx={cx} cy={cy + r + 10} rx={r * 0.55} ry={r * 0.14} className="text-compass-heading" fill="currentColor" opacity="0.18" />
      <circle cx={cx} cy={cy} r={r + 6} className="text-compass-slate" stroke="currentColor" strokeWidth="5" opacity="0.22" />
      <circle cx={cx} cy={cy} r={r} className="text-compass-link" stroke="currentColor" strokeWidth="3" opacity="0.6" />

      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={r * 0.94} />
      </clipPath>
      {/* The badge artwork's compass rose + portrait sit in its upper
          portion, with the "COVERAGE COMPASS" text banner below. A wide,
          short destination box (rather than a square one) shifts which
          slice of the source image "cover" scaling selects, so the visible
          window stops above the text banner instead of showing a sliver of
          it - see the crop math in the sibling PR/commit description. */}
      <image
        href={HERO_COMPASS_IMAGE_URL}
        x={cx - r * 1.35}
        y={cy - r * 0.94}
        width={r * 2.7}
        height={r * 1.9}
        preserveAspectRatio="xMidYMin slice"
        clipPath={`url(#${clipId})`}
      />

      <ellipse
        cx={cx - r * 0.32}
        cy={cy - r * 0.38}
        rx={r * 0.4}
        ry={r * 0.24}
        transform={`rotate(-24 ${cx - r * 0.32} ${cy - r * 0.38})`}
        className="text-compass-surface"
        fill="currentColor"
        opacity="0.28"
      />
    </g>
  )
}

function HeroBackdrop() {
  const cy = 190
  const r = 58

  return (
    <svg
      className="absolute inset-0 -z-0 h-full w-full"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* A soft out-of-focus blur, so the compasses read as sitting
            further back in the scene, a receded, hazier layer behind the
            text rather than something on the same plane as it. */}
        <filter id="heroCompassDepth" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Horizon */}
      <line
        x1="0"
        y1="300"
        x2="1200"
        y2="300"
        className="text-compass-slate"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />

      {/* Two compasses flanking the copy instead of one sitting behind it,
          each a domed housing (grounding shadow, beveled rim, glossy
          highlight) around the Coverage Compass badge artwork. */}
      <CompassEmblem cx={170} cy={cy} r={r} />
      <CompassEmblem cx={1030} cy={cy} r={r} />

      {/* Ocean, a layered wave silhouette below the horizon. */}
      <path
        d="M0,320 C100,300 200,340 300,320 C400,300 500,340 600,320 C700,300 800,340 900,320 C1000,300 1100,340 1200,320 L1200,420 L0,420 Z"
        className="text-compass-link"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M0,352 C120,336 240,368 360,352 C480,336 600,368 720,352 C840,336 960,368 1080,352 C1140,344 1200,356 1200,352 L1200,420 L0,420 Z"
        className="text-compass-blue"
        fill="currentColor"
        opacity="0.12"
      />
      {/* Foam crest along the front wave's leading edge. */}
      <path
        d="M0,352 C120,336 240,368 360,352 C480,336 600,368 720,352 C840,336 960,368 1080,352 C1140,344 1200,356 1200,352"
        className="text-compass-surface"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* A small vessel afloat in the water, sailing on the heading the
          compass above it points to. Kept low and compact so the mast
          stays clear of the CTAs and disclaimer text above it. */}
      <g opacity="0.32">
        <path
          d="M574,406 C580,398 588,395 600,395 C612,395 620,398 626,406 C612,410 588,410 574,406 Z"
          className="text-compass-heading"
          fill="currentColor"
        />
        <line x1="600" y1="395" x2="600" y2="365" className="text-compass-slate" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M600,365 L611,368.5 L600,372 Z" className="text-compass-green" fill="currentColor" />
        <path d="M601,367 L601,394 L621,394 Z" className="text-compass-surface" fill="currentColor" stroke="currentColor" strokeWidth="1" />
        <path
          d="M552,404 C564,409 580,409 592,405 M608,405 C620,409 636,409 648,404"
          className="text-compass-link"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </g>
    </svg>
  )
}

function StepCard({ step, title, body, delay = 0 }) {
  return (
    <div className={`card animate-fade-up ${delay ? `animate-fade-up-delay-${delay}` : ''}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-compass-skyblue text-sm font-semibold text-compass-link">
        {step}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-compass-heading">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-compass-slate">{body}</p>
    </div>
  )
}

function FeatureCard({ title, body }) {
  return (
    <div className="rounded-xl border border-compass-line bg-compass-paper p-6">
      <h3 className="font-medium text-compass-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-compass-slate">{body}</p>
    </div>
  )
}

function ServiceCard({ title, body, img }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-compass-line bg-compass-surface shadow-card transition hover:border-compass-blue">
      <div className="aspect-[4/3] w-full overflow-hidden bg-compass-paper">
        <img
          src={img}
          alt={`${title} — Coverage Compass educational policy review`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-lg font-semibold text-compass-heading">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-compass-slate">{body}</p>
      </div>
    </div>
  )
}

function Testimonial({ quote, attribution }) {
  return (
    <div className="card">
      <p className="font-display text-sm italic leading-relaxed text-compass-ink">
        &ldquo;{quote}&rdquo;
      </p>
      <p className="mt-4 text-xs font-medium text-compass-slate">
        &mdash; {attribution}
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
