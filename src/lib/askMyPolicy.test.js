import { describe, expect, it } from 'vitest'
import { answerQuestion, baseExplanation } from './askMyPolicy.js'
import { analyzeText } from './policyAnalysis.js'

const AUTO_TEXT = `
AUTO INSURANCE POLICY
Named Insured: Jane Rivera
Bodily Injury Liability $100,000/$300,000
Property Damage Liability $50,000
Comprehensive $500 deductible
Collision $500 deductible
This policy does not include rental reimbursement.
`

const analysis = analyzeText(AUTO_TEXT, { fileName: 'auto.txt' })

describe('answerQuestion - grounded in the analysis object only', () => {
  it('answers about a coverage that was found, using its real limit', () => {
    const result = answerQuestion('Do I have bodily injury liability?', analysis)
    expect(result.kind).toBe('coverage-found')
    expect(result.data.coverage.name).toBe('Bodily Injury Liability')
    expect(result.data.coverage.limit).toContain('100,000')
  })

  it('answers about a coverage that was NOT found (negation-aware) without fabricating a limit', () => {
    const result = answerQuestion('Do I have rental coverage?', analysis)
    expect(result.kind).toBe('coverage-missing')
    expect(result.data.coverage.name).toBe('Rental Reimbursement')
    expect(result.data.coverage.limit).toBe('NEEDED INFORMATION')
  })

  it('answers a gap-topic question (e.g. umbrella) using the gap rule, not a coverage rule', () => {
    const result = answerQuestion('Would umbrella insurance help me?', analysis)
    expect(result.kind).toBe('gap-missing')
    expect(result.data.gap.name).toBe('Umbrella Insurance')
  })

  it('answers a deductible question from scoreCategories, not a fabricated coverage', () => {
    const result = answerQuestion("What's my deductible?", analysis)
    expect(result.kind).toBe('deductible')
    expect(['good', 'review']).toContain(result.data.status)
  })

  it('answers a named-insured question from the extracted field', () => {
    const result = answerQuestion('Who is the named insured?', analysis)
    expect(result.kind).toBe('namedInsured')
    expect(result.data.namedInsured).toBe('Jane Rivera')
  })

  it('answers a policy-type question', () => {
    const result = answerQuestion('What kind of policy is this?', analysis)
    expect(result.kind).toBe('policyType')
    expect(result.data.detectedPolicyType).toContain('Auto')
  })

  it('answers a coverage-score question', () => {
    const result = answerQuestion("What's my coverage score?", analysis)
    expect(result.kind).toBe('score')
    expect(result.data.coverageScore).toBe(analysis.coverageScore)
  })

  it('redirects out-of-scope shopping/legal questions instead of guessing', () => {
    expect(answerQuestion('Should I switch carriers?', analysis).kind).toBe('out-of-scope')
    expect(answerQuestion('What is the best insurance company?', analysis).kind).toBe('out-of-scope')
    expect(answerQuestion('Should I sue my landlord?', analysis).kind).toBe('out-of-scope')
  })

  it('falls back to "unmatched" for a question with no grounded field, never fabricating an answer', () => {
    const result = answerQuestion('What color is my car?', analysis)
    expect(result.kind).toBe('unmatched')
  })

  it('returns "unmatched" for an empty question', () => {
    expect(answerQuestion('', analysis).kind).toBe('unmatched')
    expect(answerQuestion('   ', analysis).kind).toBe('unmatched')
  })
})

describe('answerQuestion - Spanish phrasing', () => {
  it('answers a Spanish deductible question via the same grounded field as English', () => {
    const result = answerQuestion('¿Cuál es mi deducible?', analysis)
    expect(result.kind).toBe('deductible')
  })

  it('answers a Spanish named-insured question', () => {
    const result = answerQuestion('¿Quién es el asegurado?', analysis)
    expect(result.kind).toBe('namedInsured')
    expect(result.data.namedInsured).toBe('Jane Rivera')
  })

  it('redirects a Spanish out-of-scope question instead of guessing', () => {
    expect(answerQuestion('¿Debería cambiar de aseguradora?', analysis).kind).toBe('out-of-scope')
  })

  it('falls back to "unmatched" for a Spanish free-text coverage question, rather than risking a wrong match against the English-only coverage corpus', () => {
    const result = answerQuestion('¿Tengo cobertura de auto de alquiler?', analysis)
    expect(result.kind).toBe('unmatched')
  })
})

describe('baseExplanation', () => {
  it('strips the "Not found in the uploaded document." suffix when present', () => {
    expect(baseExplanation('Covers something. Not found in the uploaded document.')).toBe('Covers something.')
  })

  it('leaves an explanation without that suffix unchanged', () => {
    expect(baseExplanation('Covers something.')).toBe('Covers something.')
  })
})
