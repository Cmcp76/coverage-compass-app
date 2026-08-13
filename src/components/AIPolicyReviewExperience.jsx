import { useEffect, useRef, useState } from 'react'
import Cece, { useCeceTips } from './Cece.jsx'

// Coverage Compass — AI Policy Review Experience
// -------------------------------------------------
// Replaces a plain loading spinner with a guided sequence that mirrors how
// the policy is actually being read, driven by real progress rather than a
// fixed timer: Read -> Analyze -> Score -> Report.
//
// `stage` is owned by the caller (Upload.jsx) and reflects real async work:
//   - 'reading':   extracting text from the uploaded file
//   - 'analyzing': the real analysis call is in flight (LLM or fallback) -
//                  duration is unknown, so this phase loops/holds at its
//                  last checklist item rather than assuming a fixed length
//   - 'done':      analysis finished - triggers the score count-up (to the
//                  real `score` prop), a quick report reveal, then
//                  onComplete()
// Everything after 'done' is a short, fixed-length cosmetic reveal, which is
// fine since the real work is already finished by that point.

const READ_ITEMS = [
  { key: 'dec', label: 'Reading declarations page' },
  { key: 'vehicles', label: 'Identifying vehicles & drivers' },
  { key: 'liability', label: 'Reviewing liability limits' },
  { key: 'deductibles', label: 'Checking deductibles' },
  { key: 'endorsements', label: 'Looking for endorsements' },
  { key: 'gaps', label: 'Scanning for possible gaps' },
]

const ASSISTANT_MESSAGES = [
  'Reading your declarations page…',
  'Checking your liability limits…',
  'Looking for rental & roadside coverage…',
  'Comparing this against common coverage areas…',
  'Almost there — pulling it all together…',
]

const TIPS = [
  'Higher deductibles usually mean a lower premium — but more out-of-pocket cost if you file a claim.',
  "Standard homeowners policies typically don't cover flood damage, even outside a flood zone.",
  'An umbrella policy adds liability protection above your auto or home limits.',
  'Actual cash value and replacement cost can mean very different payouts after a loss.',
  'Certificates of insurance are often required by landlords and contracts — worth knowing what yours shows.',
]

const REPORT_ITEMS = [
  { key: 'summary', label: 'Policy summary' },
  { key: 'coverages', label: 'Coverages & limits' },
  { key: 'deductibles', label: 'Deductibles' },
  { key: 'questions', label: 'Questions to ask' },
  { key: 'notes', label: 'Educational notes' },
  { key: 'pdf', label: 'PDF ready' },
]

// ms durations for the cosmetic phases only (score/report) - the
// reading/analyzing phases run for however long the real work takes.
const TIMING = {
  perReadItem: 650,
  scoreCountUp: 1400,
  perReportItem: 220,
  settleBeforeComplete: 400,
}

// Maps this component's phase names to Cece's states - 'score' still reads
// as "analyzing" from Cece's point of view, and 'report' is where she's
// explaining what was found, hence 'teaching'.
const PHASE_TO_CECE_STATE = {
  reading: 'reading',
  analyzing: 'analyzing',
  score: 'analyzing',
  report: 'teaching',
  complete: 'complete',
}

export default function AIPolicyReviewExperience({
  stage,
  score = 0,
  onViewReport,
  onDownloadPdf,
  downloadingPdf,
  onComplete,
}) {
  const [visualPhase, setVisualPhase] = useState('reading') // reading | analyzing | score | report | complete
  const [readIndex, setReadIndex] = useState(-1)
  const [assistantIdx, setAssistantIdx] = useState(0)
  const [tipIdx, setTipIdx] = useState(0)
  const [scoreValue, setScoreValue] = useState(0)
  const [reportIndex, setReportIndex] = useState(-1)
  const timers = useRef([])

  const clearTimers = () => {
    timers.current.forEach((t) => {
      clearTimeout(t)
      clearInterval(t)
    })
    timers.current = []
  }

  // Mirror the real stage while real work is happening. Once it flips to
  // 'done', the cosmetic sequence below takes over on its own timing.
  useEffect(() => {
    if (stage === 'reading' || stage === 'analyzing') setVisualPhase(stage)
  }, [stage])

  useEffect(() => {
    if (visualPhase !== 'analyzing') return
    const iv = setInterval(() => {
      setReadIndex((i) => Math.min(i + 1, READ_ITEMS.length - 1))
    }, TIMING.perReadItem)
    timers.current.push(iv)
    return () => clearInterval(iv)
  }, [visualPhase])

  useEffect(() => {
    if (visualPhase !== 'analyzing') return
    const iv = setInterval(() => setAssistantIdx((i) => (i + 1) % ASSISTANT_MESSAGES.length), 1300)
    timers.current.push(iv)
    return () => clearInterval(iv)
  }, [visualPhase])

  useEffect(() => {
    if (visualPhase !== 'analyzing') return
    const iv = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 2100)
    timers.current.push(iv)
    return () => clearInterval(iv)
  }, [visualPhase])

  // Real work finished - fill the checklist and hand off to the cosmetic
  // score/report reveal.
  useEffect(() => {
    if (stage !== 'done') return
    setReadIndex(READ_ITEMS.length - 1)
    setVisualPhase((p) => (p === 'score' || p === 'report' || p === 'complete' ? p : 'score'))
  }, [stage])

  useEffect(() => {
    if (visualPhase !== 'score') return
    const start = Date.now()
    const iv = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / TIMING.scoreCountUp)
      const eased = 1 - Math.pow(1 - t, 3)
      setScoreValue(Math.round(eased * score))
      if (t >= 1) {
        clearInterval(iv)
        timers.current.push(setTimeout(() => setVisualPhase('report'), 500))
      }
    }, 30)
    timers.current.push(iv)
    return () => clearInterval(iv)
  }, [visualPhase, score])

  useEffect(() => {
    if (visualPhase !== 'report') return
    const iv = setInterval(() => {
      setReportIndex((i) => {
        const next = i + 1
        if (next >= REPORT_ITEMS.length) {
          clearInterval(iv)
          timers.current.push(setTimeout(() => setVisualPhase('complete'), TIMING.settleBeforeComplete))
          return i
        }
        return next
      })
    }, TIMING.perReportItem)
    timers.current.push(iv)
    return () => clearInterval(iv)
  }, [visualPhase])

  useEffect(() => {
    if (visualPhase === 'complete' && onComplete) onComplete()
  }, [visualPhase, onComplete])

  useEffect(() => () => clearTimers(), [])

  const ceceState = PHASE_TO_CECE_STATE[visualPhase] || 'reading'
  const ceceTip = useCeceTips(ceceState)

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-compass-line bg-compass-surface shadow-card overflow-hidden">
      <style>{`
        @keyframes cc-confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(220px) rotate(340deg); opacity: 0; }
        }
      `}</style>

      <div className="px-6 pt-6 pb-4 border-b border-compass-line">
        <Cece state={ceceState} message={ceceTip} size="md" />
      </div>

      <div className="p-6">
        {visualPhase === 'reading' && <ReadingPhase />}

        {visualPhase === 'analyzing' && (
          <AnalyzingPhase
            activeIndex={readIndex}
            assistantMessage={ASSISTANT_MESSAGES[assistantIdx]}
            tip={TIPS[tipIdx]}
          />
        )}

        {visualPhase === 'score' && <ScorePhase value={scoreValue} />}

        {visualPhase === 'report' && <ReportPhase activeIndex={reportIndex} />}

        {visualPhase === 'complete' && (
          <CompletePhase onViewReport={onViewReport} onDownloadPdf={onDownloadPdf} downloadingPdf={downloadingPdf} />
        )}
      </div>
    </div>
  )
}

function ReadingPhase() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <FileTextIcon className="w-4 h-4 text-compass-heading" />
        <span className="text-sm font-medium text-compass-heading">Reading your file…</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-compass-line">
        <div className="progress-indeterminate" />
      </div>
      <p className="mt-3 text-xs text-compass-slate">Never sold or shared.</p>
    </div>
  )
}

function AnalyzingPhase({ activeIndex, assistantMessage, tip }) {
  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {READ_ITEMS.map((item, i) => {
          const status = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
          return (
            <li
              key={item.key}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300 ${
                status === 'active' ? 'bg-compass-blue/[0.06]' : status === 'done' ? 'bg-compass-green/[0.06]' : 'bg-transparent'
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  status === 'done'
                    ? 'bg-compass-green text-white'
                    : status === 'active'
                    ? 'bg-compass-blue text-white'
                    : 'bg-compass-line text-compass-slate'
                }`}
              >
                {status === 'done' ? (
                  <CheckIcon className="w-3 h-3" />
                ) : status === 'active' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ) : null}
              </span>
              <span
                className={`text-sm transition-colors duration-300 ${
                  status === 'done'
                    ? 'text-compass-green font-medium'
                    : status === 'active'
                    ? 'text-compass-heading font-medium'
                    : 'text-compass-slate'
                }`}
              >
                {item.label}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="rounded-2xl bg-compass-navy text-white px-4 py-3 flex items-start gap-3" aria-live="polite">
        <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-compass-amber" />
        <p className="text-sm leading-snug">{assistantMessage}</p>
      </div>

      <div className="rounded-2xl border border-compass-line px-4 py-3 flex items-start gap-3">
        <span className="text-base leading-none mt-0.5" aria-hidden="true">
          💡
        </span>
        <p className="text-xs text-compass-slate leading-relaxed">{tip}</p>
      </div>
    </div>
  )
}

function ScorePhase({ value }) {
  return (
    <div className="flex flex-col items-center py-6">
      <p className="text-xs uppercase tracking-wide text-compass-slate mb-2">Your Coverage Score</p>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" className="stroke-compass-line" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            className="stroke-compass-green transition-[stroke-dashoffset] duration-100 ease-linear"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - value / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-compass-heading tabular-nums">{value}</span>
          <span className="text-xs text-compass-slate">out of 100</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-compass-slate text-center max-w-xs">
        An educational snapshot of your coverage — not a guarantee.
      </p>
    </div>
  )
}

function ReportPhase({ activeIndex }) {
  return (
    <div>
      <p className="text-sm font-medium text-compass-heading mb-3 flex items-center gap-2">
        <ShieldCheckIcon className="w-4 h-4 text-compass-green" /> Creating your report…
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {REPORT_ITEMS.map((item, i) => {
          const done = i <= activeIndex
          return (
            <li
              key={item.key}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-300 ${
                done ? 'border-compass-green/30 bg-compass-green/[0.06] text-compass-heading' : 'border-compass-line text-compass-slate/60'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  done ? 'bg-compass-green text-white' : 'bg-compass-line'
                }`}
              >
                {done && <CheckIcon className="w-2.5 h-2.5" />}
              </span>
              {item.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CompletePhase({ onViewReport, onDownloadPdf, downloadingPdf }) {
  const pieces = Array.from({ length: 18 })
  const colorClasses = ['bg-compass-blue', 'bg-compass-green', 'bg-compass-amber']
  return (
    <div className="relative flex flex-col items-center text-center py-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 overflow-hidden" aria-hidden="true">
        {pieces.map((_, i) => (
          <span
            key={i}
            className={`absolute w-1.5 h-3 rounded-sm ${colorClasses[i % colorClasses.length]}`}
            style={{
              left: `${(i / pieces.length) * 100}%`,
              animation: `cc-confetti-fall ${1.4 + (i % 5) * 0.15}s ease-in ${(i % 6) * 0.08}s 1 both`,
            }}
          />
        ))}
      </div>

      <div className="w-14 h-14 rounded-full bg-compass-green/10 flex items-center justify-center mb-4">
        <CheckIcon className="w-7 h-7 text-compass-green" />
      </div>
      <h3 className="text-lg font-semibold text-compass-heading">Your educational review is complete</h3>
      <p className="text-sm text-compass-slate mt-1 max-w-xs">
        Take a look at what we found, then bring your questions to a licensed insurance professional.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full">
        <button onClick={onViewReport} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
          View Report <ArrowRightIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDownloadPdf}
          disabled={downloadingPdf}
          className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <DownloadIcon className="w-4 h-4" /> {downloadingPdf ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>
    </div>
  )
}

function FileTextIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ShieldCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparklesIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M11 3l1.2 3.8L16 8l-3.8 1.2L11 13l-1.2-3.8L6 8l3.8-1.2L11 3z" fill="currentColor" />
      <path d="M18 13l.7 2.1L21 16l-2.3.9L18 19l-.7-2.1L15 16l2.3-.9L18 13z" fill="currentColor" />
    </svg>
  )
}

function DownloadIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRightIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
