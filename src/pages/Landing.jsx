import { Link } from 'react-router-dom'
import { articles } from '../data/mockData.js'

export default function Landing() {
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
            <Link to="/upload" className="btn-primary px-6 py-3 text-base">
              Upload Your Policy
            </Link>
            <Link to="/learning-center" className="btn-secondary px-6 py-3 text-base">
              Learn About Insurance
            </Link>
          </div>
          <p className="animate-fade-up animate-fade-up-delay-3 mt-4 text-xs text-compass-slate">
            Free educational review. Your documents are never sold or shared. Not
            affiliated with any single carrier.
          </p>
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
            title="Upload Your Policy"
            body="Drop in your declarations page, ACORD form, or full policy, auto, homeowners, renters, general liability, workers' compensation, or trucking/motor carrier. PDF or text file works best."
            delay={0}
          />
          <StepCard
            step="2"
            title="Get a Plain-Language Review"
            body="Our AI reads through the document and translates the jargon into a summary anyone can understand: what's covered, your limits, and where there might be gaps worth a second look."
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
                to="/learning-center"
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
            a="Yes. Documents are encrypted, used only to generate your educational review, and are never sold or shared with third parties."
          />
          <FaqItem
            q="Does Coverage Compass guarantee my coverage is adequate?"
            a="No. Coverage Compass provides educational information only. Only a licensed insurance professional can advise on and bind actual coverage decisions."
          />
        </div>
      </section>
    </div>
  )
}

const compassTickAngles = [0, 45, 90, 135, 180, 225, 270, 315]
const compassMinorTickAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]
const compassLabels = [
  { angle: 0, text: 'N' },
  { angle: 90, text: 'E' },
  { angle: 180, text: 'S' },
  { angle: 270, text: 'W' },
]

function HeroBackdrop() {
  const cx = 600
  const cy = 190
  const r = 74

  return (
    <svg
      className="absolute inset-0 -z-0 h-full w-full"
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* A soft out-of-focus blur, so the compass reads as sitting
            further back in the scene, a receded, hazier layer behind the
            text rather than something on the same plane as it. */}
        <filter id="heroCompassDepth" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1" />
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

      {/* Compass, centered and given a domed, 3D feel via a grounding
          shadow, a beveled rim, and a glossy highlight (all fixed, like a
          housing), with a spinning navigation-rose dial inside it, bearing
          lines, a 16-point tick graduation, and N/E/S/W labels. The spin
          respects prefers-reduced-motion via .animate-compass-spin. The
          whole thing is blurred and dimmed a touch to push it back in
          depth, behind the text instead of competing on the same plane. */}
      <g filter="url(#heroCompassDepth)">
        <ellipse cx={cx} cy={cy + r + 10} rx={r * 0.55} ry={r * 0.14} className="text-compass-heading" fill="currentColor" opacity="0.12" />
        <circle cx={cx} cy={cy} r={r + 6} className="text-compass-slate" stroke="currentColor" strokeWidth="5" opacity="0.15" />
        <circle cx={cx} cy={cy} r={r} className="text-compass-link" stroke="currentColor" strokeWidth="3" opacity="0.4" />

        <g className="animate-compass-spin" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={r * 0.7} className="text-compass-link" stroke="currentColor" strokeWidth="1.5" opacity="0.26" />

          {/* Bearing-line star, the classic radiating lines of a nautical
              chart compass rose. */}
          {compassTickAngles.map((angle) => (
            <line
              key={`ray-${angle}`}
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r * 0.66}
              transform={`rotate(${angle} ${cx} ${cy})`}
              className="text-compass-link"
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.14"
            />
          ))}

          {/* 16-point graduation. */}
          {compassMinorTickAngles.map((angle) => (
            <line
              key={`minor-${angle}`}
              x1={cx}
              y1={cy - r + 3}
              x2={cx}
              y2={cy - r - 5}
              transform={`rotate(${angle} ${cx} ${cy})`}
              className="text-compass-slate"
              stroke="currentColor"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.2"
            />
          ))}
          {compassTickAngles.map((angle) => {
            const isCardinal = angle % 90 === 0
            return (
              <line
                key={angle}
                x1={cx}
                y1={cy - r + 2}
                x2={cx}
                y2={cy - r - (isCardinal ? 16 : 8)}
                transform={`rotate(${angle} ${cx} ${cy})`}
                className="text-compass-slate"
                stroke="currentColor"
                strokeWidth={isCardinal ? 2.6 : 1.6}
                strokeLinecap="round"
                opacity="0.4"
              />
            )
          })}

          {compassLabels.map(({ angle, text }) => {
            const isNorth = text === 'N'
            const labelR = r + 30
            const x = cx + labelR * Math.sin((angle * Math.PI) / 180)
            const y = cy - labelR * Math.cos((angle * Math.PI) / 180)
            return (
              <text
                key={text}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={isNorth ? 'text-compass-heading' : 'text-compass-slate'}
                fill="currentColor"
                fontSize={isNorth ? r * 0.22 : r * 0.17}
                fontWeight={isNorth ? 800 : 700}
                opacity={isNorth ? 0.55 : 0.4}
              >
                {text}
              </text>
            )
          })}

          <path
            d={`M${cx} ${cy - r * 0.55} L${cx + r * 0.16} ${cy} L${cx} ${cy - r * 0.1} L${cx - r * 0.16} ${cy} Z`}
            className="text-compass-green"
            fill="currentColor"
            opacity="0.4"
          />
          <path
            d={`M${cx} ${cy + r * 0.55} L${cx + r * 0.16} ${cy} L${cx} ${cy + r * 0.1} L${cx - r * 0.16} ${cy} Z`}
            className="text-compass-heading"
            fill="currentColor"
            opacity="0.3"
          />
          <circle cx={cx} cy={cy} r="6" className="text-compass-heading" fill="currentColor" opacity="0.42" />
          <circle cx={cx - 1.8} cy={cy - 1.8} r="1.8" className="text-compass-surface" fill="currentColor" opacity="0.5" />
        </g>

        <ellipse
          cx={cx - r * 0.32}
          cy={cy - r * 0.38}
          rx={r * 0.4}
          ry={r * 0.24}
          transform={`rotate(-24 ${cx - r * 0.32} ${cy - r * 0.38})`}
          className="text-compass-surface"
          fill="currentColor"
          opacity="0.2"
        />
      </g>

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
