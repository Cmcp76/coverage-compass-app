import { useState } from 'react'
import { Link } from 'react-router-dom'
import HomeInventory from '../components/tools/HomeInventory.jsx'
import ComparisonTool from '../components/tools/ComparisonTool.jsx'
import AnnualCheckup from '../components/tools/AnnualCheckup.jsx'
import Glossary from '../components/tools/Glossary.jsx'

const toolList = [
  { id: 'deductible', label: 'Deductible Calculator' },
  { id: 'quiz', label: 'Risk Assessment Quiz' },
  { id: 'inventory', label: 'Home Inventory Checklist' },
  { id: 'comparison', label: 'Coverage Comparison Tool' },
  { id: 'checkup', label: 'Annual Insurance Checkup' },
  { id: 'glossary', label: 'Insurance Glossary' },
]

export default function Tools() {
  const [active, setActive] = useState('deductible')

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        Insurance Tools to Help You Think It Through
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Simple, no-signup-required tools to help you estimate, compare, and prepare,
        before or after you upload a policy.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {toolList.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              active === t.id
                ? 'bg-compass-blue text-white'
                : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {active === 'deductible' && <DeductibleCalculator />}
        {active === 'quiz' && <RiskQuiz />}
        {active === 'inventory' && <HomeInventory />}
        {active === 'comparison' && <ComparisonTool />}
        {active === 'checkup' && <AnnualCheckup />}
        {active === 'glossary' && <Glossary />}
      </div>
    </div>
  )
}

function DeductibleCalculator() {
  const [claim, setClaim] = useState(5000)
  const [a, setA] = useState(500)
  const [b, setB] = useState(1000)

  const fmt = (n) => `$${Math.max(0, Math.round(n)).toLocaleString()}`
  const outA = `You pay ${fmt(Math.min(a, claim))} out of pocket. Your policy would cover ${fmt(Math.max(0, claim - a))} of a ${fmt(claim)} claim.`
  const outB = `You pay ${fmt(Math.min(b, claim))} out of pocket. Your policy would cover ${fmt(Math.max(0, claim - b))} of a ${fmt(claim)} claim.`

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-heading">
        Deductible Calculator
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        See how different deductible levels could affect your out-of-pocket costs if
        you file a claim.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <NumberField label="Estimated claim amount" value={claim} onChange={setClaim} />
        <NumberField label="Deductible option A" value={a} onChange={setA} />
        <NumberField label="Deductible option B" value={b} onChange={setB} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-compass-paper p-4">
          <p className="text-xs font-medium text-compass-slate">With option A</p>
          <p className="mt-1 text-sm text-compass-ink">{outA}</p>
        </div>
        <div className="rounded-lg bg-compass-paper p-4">
          <p className="text-xs font-medium text-compass-slate">With option B</p>
          <p className="mt-1 text-sm text-compass-ink">{outB}</p>
        </div>
      </div>

      <p className="disclaimer mt-4">
        A higher deductible usually means a lower premium, but more out-of-pocket cost
        if you file a claim. Not sure which deductible is right for you? Ask your
        insurance professional.
      </p>
    </div>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-compass-slate">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-compass-line px-3 py-2 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
      />
    </label>
  )
}

const quizQuestions = [
  {
    q: 'What type of property do you live in?',
    options: ['Own a home', 'Rent', 'Own a condo', 'Landlord'],
  },
  {
    q: 'Do you own any high-value items (jewelry, art, collectibles)?',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    q: 'Do you have significant personal assets (savings, home equity, investments)?',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    q: 'Do you run a business from home or drive for work purposes?',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    q: 'Does your business store customer data, take online payments, or rely on computer systems to operate?',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    q: 'Have you reviewed your policy in the last 12 months?',
    options: ['Yes', 'No'],
  },
]

const propertySuggestions = {
  'Own a home': 'Flood Coverage, often excluded from standard homeowners policies by default',
  Rent: 'Renters Insurance for your personal belongings and liability',
  'Own a condo': 'Condo (HO-6) Insurance and Loss Assessment Coverage',
  Landlord: 'Landlord/Dwelling coverage and Loss of Rental Income Coverage',
}

function buildSuggestions(answers) {
  const suggestions = []
  if (propertySuggestions[answers[0]]) suggestions.push(propertySuggestions[answers[0]])
  if (answers[1] === 'Yes') suggestions.push('Scheduled Personal Property for your high-value items')
  if (answers[2] === 'Yes') {
    suggestions.push('Umbrella Insurance, to extend liability protection above your underlying limits')
  }
  if (answers[3] === 'Yes') suggestions.push('A Business Use Endorsement or a separate commercial policy')
  if (answers[4] === 'Yes') {
    suggestions.push('Cyber Liability Insurance, to cover costs from data breaches, ransomware, or other cyber incidents')
  }
  if (answers[5] === 'No') suggestions.push('An annual policy review, since it has been over 12 months')
  if (suggestions.length === 0) {
    suggestions.push('Your basics look covered. An annual check-in is still a good habit.')
  }
  return suggestions.slice(0, 5)
}

function RiskQuiz() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function select(i, option) {
    setAnswers((prev) => ({ ...prev, [i]: option }))
  }

  const allAnswered = quizQuestions.every((_, i) => answers[i])

  return (
    <div className="card">
      <h2 className="font-display text-lg font-semibold text-compass-heading">
        Risk Assessment Quiz
      </h2>
      <p className="mt-1 text-sm text-compass-slate">
        Answer a few quick questions to get a general sense of coverage areas that
        might be worth exploring for your situation.
      </p>

      <div className="mt-6 space-y-5">
        {quizQuestions.map((item, i) => (
          <div key={item.q}>
            <p className="text-sm font-medium text-compass-ink">{item.q}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => select(i, opt)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    answers[i] === opt
                      ? 'bg-compass-blue text-white'
                      : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={!allAnswered}
        onClick={() => setSubmitted(true)}
        className="btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-40"
      >
        See My Results
      </button>

      {submitted && (
        <div role="status" className="mt-5 rounded-lg bg-compass-paper p-4">
          <p className="text-sm font-medium text-compass-ink">
            Based on your answers, here are a few coverage areas that may be worth
            exploring:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-compass-ink">
            {buildSuggestions(answers).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-compass-slate">
            These aren't recommendations, they're starting points for a conversation
            with your insurance professional.
          </p>
          <Link to="/upload" className="btn-secondary mt-4 inline-flex">
            Upload Your Policy for a More Specific Review
          </Link>
        </div>
      )}

      <p className="disclaimer mt-4">
        This quiz provides general educational suggestions based on your answers. It
        is not a personalized insurance assessment and does not account for your full
        financial or risk profile.
      </p>
    </div>
  )
}

