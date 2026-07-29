import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { localePath } from '../utils/localeRouting.js'
import {
  challengeIntro,
  challengeQuestions,
  challengeResultsCopy,
  challengeDisclaimer,
} from '../data/challengeQuiz.js'
import { InlineEducationalNote } from '../components/Disclaimer.jsx'
import RequestCallback from '../components/RequestCallback.jsx'
import { getChallengeScore, getMissedTopics } from '../lib/challengeScoring.js'

export default function Challenge() {
  const [stage, setStage] = useState('intro') // intro | quiz | results
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([])

  function startChallenge() {
    setCurrentIndex(0)
    setAnswers([])
    setStage('quiz')
  }

  function retakeChallenge() {
    setCurrentIndex(0)
    setAnswers([])
    setStage('intro')
  }

  function selectAnswer(optionIndex) {
    if (answers[currentIndex] !== undefined) return
    const question = challengeQuestions[currentIndex]
    const correct = optionIndex === question.correctIndex
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = { selectedIndex: optionIndex, correct }
      return next
    })
  }

  function goToNext() {
    if (currentIndex + 1 < challengeQuestions.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setStage('results')
    }
  }

  if (stage === 'intro') {
    return <IntroScreen onStart={startChallenge} />
  }

  if (stage === 'quiz') {
    return (
      <QuizScreen
        currentIndex={currentIndex}
        answer={answers[currentIndex]}
        onSelect={selectAnswer}
        onNext={goToNext}
      />
    )
  }

  return <ResultsScreen answers={answers} onRetake={retakeChallenge} />
}

function IntroScreen({ onStart }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <ChallengeCompassIcon />
      <span className="mt-6 tag-neutral">5-minute challenge</span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-compass-heading sm:text-4xl">
        {challengeIntro.headline}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-compass-slate">
        {challengeIntro.subheadline}
      </p>
      <p className="mt-3 text-sm text-compass-slate">{challengeIntro.trustLine}</p>
      <button type="button" className="btn-primary mt-8 px-6 py-3 text-base" onClick={onStart}>
        {challengeIntro.cta}
      </button>
    </div>
  )
}

// A larger echo of the header's compass mark, so the intro screen reads as
// an intentional part of the brand rather than the bare wall of text it was
// before, without inventing a whole new visual motif for one screen.
function ChallengeCompassIcon() {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-compass-skyblue">
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="12.5" className="text-compass-link" stroke="currentColor" strokeWidth="1.5" />
        <g className="text-compass-slate" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M14 1.8v2.5" />
          <path d="M14 23.7v2.5" />
          <path d="M26.2 14h-2.5" />
          <path d="M1.8 14h2.5" />
        </g>
        <path d="M14 6L16.3 14L14 12.7L11.7 14Z" className="text-compass-green" fill="currentColor" />
        <path d="M14 22L16.3 14L14 15.3L11.7 14Z" className="text-compass-heading" fill="currentColor" />
        <circle cx="14" cy="14" r="1.4" className="text-compass-heading" fill="currentColor" />
      </svg>
    </span>
  )
}

function QuizScreen({ currentIndex, answer, onSelect, onNext }) {
  const total = challengeQuestions.length
  const question = challengeQuestions[currentIndex]
  const answered = answer !== undefined
  const isLast = currentIndex === total - 1
  const progressPct = Math.round(((currentIndex + (answered ? 1 : 0)) / total) * 100)
  const questionRef = useRef(null)

  useEffect(() => {
    questionRef.current?.focus()
  }, [currentIndex])

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between text-xs font-medium text-compass-slate">
        <span>
          Question {currentIndex + 1} of {total}
        </span>
        <span>{progressPct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-compass-line">
        <div
          className="h-full rounded-full bg-compass-blue transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="card mt-6">
        <h2
          ref={questionRef}
          tabIndex={-1}
          className="text-sm font-medium leading-relaxed text-compass-ink focus:outline-none"
        >
          {question.question}
        </h2>

        <div className="mt-5 space-y-2">
          {question.options.map((option, i) => (
            <AnswerOption
              key={i}
              option={option}
              index={i}
              answered={answered}
              isSelected={answer?.selectedIndex === i}
              isCorrectOption={i === question.correctIndex}
              onSelect={() => onSelect(i)}
            />
          ))}
        </div>

        {answered && (
          <div role="status" className="mt-5 rounded-lg border border-compass-line bg-compass-paper p-4">
            <p className="text-sm font-semibold text-compass-ink">
              {answer.correct
                ? 'Correct.'
                : `Not quite — the correct answer is ${optionLetters[question.correctIndex]}. ${
                    question.options[question.correctIndex]
                  }`}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-compass-slate">
              Why
            </p>
            <p className="mt-1 text-sm leading-relaxed text-compass-ink">{question.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!answered}
            onClick={onNext}
          >
            {isLast ? 'See My Results' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  )
}

const optionLetters = ['A', 'B', 'C', 'D']

function AnswerOption({ option, index, answered, isSelected, isCorrectOption, onSelect }) {
  let stateClasses = 'border-compass-line hover:border-compass-blue'
  let pill = null

  if (answered) {
    if (isSelected && isCorrectOption) {
      stateClasses = 'border-compass-green bg-compass-mint'
      pill = <span className="tag-good shrink-0">Correct</span>
    } else if (isSelected && !isCorrectOption) {
      stateClasses = 'border-compass-amber bg-compass-amberlight'
      pill = <span className="tag-review shrink-0">Your answer</span>
    } else if (!isSelected && isCorrectOption) {
      stateClasses = 'border-compass-green'
      pill = <span className="tag-good shrink-0">Correct answer</span>
    } else {
      stateClasses = 'border-compass-line opacity-60'
    }
  }

  return (
    <button
      type="button"
      disabled={answered}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm text-compass-ink transition disabled:cursor-default ${stateClasses}`}
    >
      <span>
        <span className="mr-2 font-semibold text-compass-slate">{optionLetters[index]}.</span>
        {option}
      </span>
      {pill}
    </button>
  )
}

function ResultsScreen({ answers, onRetake }) {
  const score = getChallengeScore(answers)
  const missedTopics = getMissedTopics(challengeQuestions, answers)
  const headingRef = useRef(null)
  const { lang } = useParams()

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-center font-display text-2xl font-semibold text-compass-heading focus:outline-none"
      >
        {challengeResultsCopy.headline}
      </h1>

      <div className="card mt-6 text-center">
        <p className="font-display text-5xl font-semibold text-compass-heading">
          {score}
          <span className="text-2xl font-normal text-compass-slate"> / {challengeQuestions.length}</span>
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-compass-slate">
          {challengeResultsCopy.framing}
        </p>
      </div>

      <div className="mt-6">
        <InlineEducationalNote>{challengeDisclaimer}</InlineEducationalNote>
      </div>

      <div className="card mt-6">
        <p className="text-sm font-medium text-compass-ink">
          {missedTopics.length > 0 ? challengeResultsCopy.topicsIntro : 'Nice work.'}
        </p>
        {missedTopics.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {missedTopics.map((topic) => (
              <li key={topic} className="text-sm text-compass-slate">
                {topic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-compass-slate">{challengeResultsCopy.noMissedTopics}</p>
        )}
      </div>

      <div className="mt-6">
        <RequestCallback ctaLabel={challengeResultsCopy.primaryCta} ctaVariant="primary" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to={localePath(lang, '/learning-center')} className="btn-secondary">
          {challengeResultsCopy.secondaryCta}
        </Link>
        <button type="button" className="text-sm font-medium text-compass-link" onClick={onRetake}>
          Retake the Challenge
        </button>
      </div>

      <div className="mt-8">
        <EmailCapture />
      </div>
    </div>
  )
}

function EmailCapture() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="card">
      <p className="text-sm font-medium text-compass-ink">{challengeResultsCopy.emailHeadline}</p>

      {sent ? (
        <div role="status" className="mt-4 rounded-lg bg-compass-mint p-4">
          <p className="text-sm font-medium text-compass-green">Results sent</p>
          <p className="mt-1 text-xs text-compass-ink">
            In a live version of Coverage Compass, this would email a copy of your results and a
            few tailored tips to {email}. This is a prototype, so nothing was actually sent.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="challenge-email">
            Email Address
          </label>
          <input
            id="challenge-email"
            type="email"
            required
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
          />
          <button type="submit" className="btn-primary shrink-0">
            {challengeResultsCopy.emailButton}
          </button>
        </form>
      )}
    </div>
  )
}
