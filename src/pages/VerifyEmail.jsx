import { useNavigate } from 'react-router-dom'

export default function VerifyEmail() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold text-compass-navy">
        Check Your Inbox
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-compass-slate">
        We sent a verification link to <strong>maria@email.com</strong>. Click the link
        to activate your account and get started with your first policy review.
      </p>
      <p className="mt-4 text-sm text-compass-slate">
        Didn't get the email? Check your spam folder, or resend it below.
      </p>
      <button className="btn-secondary mx-auto mt-4">Resend Verification Email</button>

      <button className="btn-primary mx-auto mt-8" onClick={() => navigate('/welcome')}>
        Simulate verification (prototype)
      </button>

      <p className="disclaimer mt-6">
        Verification links expire after 24 hours for your security.
      </p>
    </div>
  )
}
