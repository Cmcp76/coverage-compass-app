import { Link, useParams } from 'react-router-dom'
import { FooterDisclaimer } from '../components/Disclaimer.jsx'
import { localePath } from '../utils/localeRouting.js'

export default function Privacy() {
  const { lang } = useParams()
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-compass-slate">
        Coverage Compass is a client-side prototype. There is no server component
        in this build, so nothing you upload or type is transmitted anywhere.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        How your policy is handled
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        When you upload a policy document, it's read and analyzed entirely in your
        browser. The resulting summary and your review history are saved to your
        browser's local storage so they're available the next time you visit this
        device, they are never sent to a server, and clearing your browser data
        removes them.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        Account details
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        Sign-up and login in this prototype are simulated for demonstration
        purposes. No account, email address, or password is created, verified, or
        stored anywhere.
      </p>
      <h2 className="mt-8 font-display text-lg font-semibold text-compass-heading">
        Cookies and analytics
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        This prototype does not use tracking cookies or analytics.
      </p>
      <div className="mt-10">
        <Link to={localePath(lang, '/')} className="text-sm font-medium text-compass-link">
          Back to Home
        </Link>
      </div>
      <div className="mt-10 border-t border-compass-line pt-6">
        <FooterDisclaimer />
      </div>
    </div>
  )
}
