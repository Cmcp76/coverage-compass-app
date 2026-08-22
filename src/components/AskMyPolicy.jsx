import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { answerQuestion, baseExplanation } from '../lib/askMyPolicy.js'

const EXAMPLES = ['Do I have rental coverage?', "What's my deductible?", 'Who is the named insured?']

// Logs unanswered questions locally (no PII beyond the question text itself,
// which the person typed) so a real deployment could review, over time,
// which questions the extraction engine keeps failing to ground - purely
// diagnostic, never sent anywhere.
const UNANSWERED_LOG_KEY = 'coverage-compass-unanswered-questions'
const MAX_LOGGED = 50

function logUnanswered(question, policyType) {
  try {
    const raw = localStorage.getItem(UNANSWERED_LOG_KEY)
    const entries = raw ? JSON.parse(raw) : []
    const next = [{ question, policyType, at: new Date().toISOString() }, ...(Array.isArray(entries) ? entries : [])].slice(
      0,
      MAX_LOGGED,
    )
    localStorage.setItem(UNANSWERED_LOG_KEY, JSON.stringify(next))
  } catch {
    // Storage full or unavailable - this is a diagnostic nice-to-have, not
    // core functionality, so just skip logging rather than breaking the
    // actual answer the person is waiting on.
  }
}

function buildAnswerText(result, t) {
  const { kind, data } = result
  switch (kind) {
    case 'coverage-found':
      return `${t('askMyPolicy.answers.coverageFound', { name: data.coverage.name, limit: data.coverage.limit })} ${data.coverage.explanation}`
    case 'coverage-missing':
      return `${t('askMyPolicy.answers.coverageMissing', { name: data.coverage.name })} ${baseExplanation(data.coverage.explanation)}`
    case 'gap-found':
      return `${t('askMyPolicy.answers.gapFound', { name: data.gap.name })} ${data.gap.what}`
    case 'gap-missing':
      return `${t('askMyPolicy.answers.gapMissing', { name: data.gap.name })} ${data.gap.what} ${data.gap.why}`
    case 'deductible':
      return t(`score.tierReasons.deductibles.${data.status}`)
    case 'namedInsured':
      return t('askMyPolicy.answers.namedInsured', { namedInsured: data.namedInsured })
    case 'policyType':
      return t('askMyPolicy.answers.policyType', { detectedPolicyType: data.detectedPolicyType })
    case 'score':
      return t('askMyPolicy.answers.score', { coverageScore: data.coverageScore })
    case 'out-of-scope':
      return t('askMyPolicy.answers.outOfScope')
    case 'unmatched':
    default:
      return t('askMyPolicy.answers.unmatched')
  }
}

export default function AskMyPolicy({ analysis }) {
  const { t } = useTranslation('common')
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState([])

  function ask(text) {
    const q = text.trim()
    if (!q) return
    const result = answerQuestion(q, analysis)
    if (result.kind === 'unmatched') logUnanswered(q, analysis.detectedPolicyType)
    const answer = buildAnswerText(result, t)
    setThread((prev) => [...prev, { question: q, answer, id: `${Date.now()}-${prev.length}` }])
    setQuestion('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    ask(question)
  }

  return (
    <div className="mt-6 rounded-2xl border border-compass-line bg-compass-surface p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-compass-tealtint text-compass-teal" aria-hidden="true">
          <ChatIcon />
        </span>
        <div>
          <p className="text-sm font-semibold text-compass-heading">{t('askMyPolicy.title')}</p>
          <p className="text-xs text-compass-slate">{t('askMyPolicy.subtitle')}</p>
        </div>
      </div>

      {thread.length > 0 && (
        <div className="mt-4 space-y-3">
          {thread.map((turn) => (
            <div key={turn.id} className="space-y-1.5">
              <p className="rounded-lg bg-compass-paper px-3 py-2 text-sm font-medium text-compass-ink">
                {turn.question}
              </p>
              <div className="rounded-lg border border-compass-line px-3 py-2">
                <p className="text-sm leading-relaxed text-compass-ink">{turn.answer}</p>
                <p className="mt-1.5 text-xs text-compass-slate">{t('askMyPolicy.disclaimerLine')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t('askMyPolicy.placeholder')}
          aria-label={t('askMyPolicy.title')}
          className="min-w-0 flex-1 rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
        />
        <button type="submit" className="btn-primary shrink-0">
          {t('askMyPolicy.ask')}
        </button>
      </form>

      {thread.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => ask(example)}
              className="rounded-full border border-compass-line px-3 py-1.5 text-xs text-compass-slate transition hover:border-compass-blue hover:text-compass-link"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h16v11H9l-4 3.5v-3.5H4z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  )
}
