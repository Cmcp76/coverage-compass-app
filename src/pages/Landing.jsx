import { Link } from 'react-router-dom'
import { articles } from '../data/mockData.js'

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-compass-skyblue">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="animate-fade-up font-display text-4xl font-semibold leading-tight text-compass-navy sm:text-5xl">
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
        <h2 className="text-center font-display text-2xl font-semibold text-compass-navy">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <StepCard
            step="1"
            title="Upload Your Policy"
            body="Drop in your declarations page, ACORD form, or full policy, auto, homeowners, general liability, workers' compensation, or trucking/motor carrier. PDF or text file works best."
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-2xl font-semibold text-compass-navy">
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
              body="Auto, homeowners, general liability, workers' compensation, and trucking policies, each reviewed against the details that actually matter for that line of business."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-2xl font-semibold text-compass-navy">
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-compass-navy">
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
        <h2 className="text-center font-display text-2xl font-semibold text-compass-navy">
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

function StepCard({ step, title, body, delay = 0 }) {
  return (
    <div className={`card animate-fade-up ${delay ? `animate-fade-up-delay-${delay}` : ''}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-compass-skyblue text-sm font-semibold text-compass-blue">
        {step}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-compass-navy">
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
    <details className="group rounded-lg border border-compass-line bg-white p-5">
      <summary className="cursor-pointer list-none font-medium text-compass-ink marker:content-none">
        <span className="flex items-center justify-between">
          {q}
          <span className="text-compass-blue transition group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">{a}</p>
    </details>
  )
}
