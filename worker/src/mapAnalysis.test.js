import { describe, it, expect } from 'vitest'
import { mapClaudeResultToAnalysis } from './mapAnalysis.js'
import { coverageRuleSets, gapRuleSets } from '../../src/lib/policyDomainKnowledge.js'

const meta = { fileName: 'test.pdf', truncated: false, hasRealText: true }

describe('mapClaudeResultToAnalysis', () => {
  it('maps a well-formed auto policy result to the app analysis shape', () => {
    const claudeInput = {
      policyType: 'auto',
      namedInsured: 'Maria Alvarez',
      deductibleStated: true,
      coverages: [
        { name: 'Bodily Injury Liability', found: true, limit: '$250,000 / $500,000', confidence: 'high' },
        { name: 'Property Damage Liability', found: true, limit: '$100,000', confidence: 'high' },
        { name: 'Comprehensive', found: true, limit: null, confidence: 'medium' },
        { name: 'Collision', found: false, limit: null, confidence: 'missing' },
        { name: 'Rental Reimbursement', found: false, limit: null, confidence: 'missing' },
      ],
      gaps: [
        { name: 'Umbrella Insurance', found: false },
        { name: 'Gap Insurance (Loan/Lease Payoff)', found: false },
        { name: 'Roadside Assistance', found: true },
        { name: 'Uninsured/Underinsured Motorist', found: true },
      ],
      questionsToAsk: ['Would an umbrella policy make sense given my assets?'],
      strengths: ['Your liability limits are clearly stated and generous.'],
    }

    const result = mapClaudeResultToAnalysis(claudeInput, meta)

    expect(result.detectedPolicyType).toBe('Personal / Commercial Auto')
    expect(result.namedInsured).toBe('Maria Alvarez')
    expect(result.fileName).toBe('test.pdf')
    expect(result.analysisSource).toBe('llm')
    expect(result.coverages).toHaveLength(coverageRuleSets.auto.length)
    expect(result.gaps).toHaveLength(gapRuleSets.auto.length)

    const collision = result.coverages.find((c) => c.name === 'Collision')
    expect(collision.confidence).toBe('missing')
    expect(collision.limit).toBe('NEEDED INFORMATION')

    const bi = result.coverages.find((c) => c.name === 'Bodily Injury Liability')
    expect(bi.limit).toBe('$250,000 / $500,000')
    expect(bi.confidence).toBe('high')

    // Not-found gaps sort first, matching the fallback engine's ordering.
    expect(result.gaps[0].found).toBe(false)
    expect(result.gaps.at(-1).found).toBe(true)

    expect(result.coverageScore).toBeGreaterThanOrEqual(20)
    expect(result.coverageScore).toBeLessThanOrEqual(98)
    expect(result.questionsToAsk).toEqual(['Would an umbrella policy make sense given my assets?'])
    expect(result.strengths).toEqual(['Your liability limits are clearly stated and generous.'])
  })

  it('falls back to auto and degrades gracefully on a malformed/empty Claude response', () => {
    const result = mapClaudeResultToAnalysis({}, meta)
    expect(result.detectedPolicyType).toBe('Personal / Commercial Auto')
    expect(result.coverages).toHaveLength(coverageRuleSets.auto.length)
    expect(result.coverages.every((c) => c.confidence === 'missing')).toBe(true)
    expect(result.gaps.every((g) => g.found === false)).toBe(true)
    expect(result.namedInsured).toBeNull()
    expect(result.questionsToAsk.length).toBeGreaterThan(0)
    expect(result.strengths).toEqual([])
  })

  it('handles null/undefined claudeInput without throwing', () => {
    expect(() => mapClaudeResultToAnalysis(null, meta)).not.toThrow()
    expect(() => mapClaudeResultToAnalysis(undefined, meta)).not.toThrow()
  })

  it('ignores an unrecognized coverage/gap name from Claude rather than crashing', () => {
    const claudeInput = {
      policyType: 'homeowners',
      coverages: [{ name: 'Some Coverage Claude Made Up', found: true, limit: '$1', confidence: 'high' }],
      gaps: [{ name: 'Some Gap Claude Made Up', found: true }],
      questionsToAsk: [],
      strengths: [],
    }
    const result = mapClaudeResultToAnalysis(claudeInput, meta)
    // None of the real homeowners coverages/gaps were confirmed present,
    // since the hallucinated name doesn't match any real rule entry.
    expect(result.coverages.every((c) => c.confidence === 'missing')).toBe(true)
    expect(result.gaps.every((g) => g.found === false)).toBe(true)
  })

  it('falls back to a generic question when Claude returns none', () => {
    const claudeInput = { policyType: 'auto', coverages: [], gaps: [], questionsToAsk: [], strengths: [] }
    const result = mapClaudeResultToAnalysis(claudeInput, meta)
    expect(result.questionsToAsk.length).toBeGreaterThan(0)
  })

  it('caps questionsToAsk at 5 and strengths at 4', () => {
    const claudeInput = {
      policyType: 'auto',
      coverages: [],
      gaps: [],
      questionsToAsk: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'],
      strengths: ['s1', 's2', 's3', 's4', 's5', 's6'],
    }
    const result = mapClaudeResultToAnalysis(claudeInput, meta)
    expect(result.questionsToAsk).toHaveLength(5)
    expect(result.strengths).toHaveLength(4)
  })

  it('produces identical coverageScore/scoreCategories formula behavior as the fallback engine for an equivalent input', async () => {
    const { computeCoverageScore, computeScoreCategories } = await import('../../src/lib/policyDomainKnowledge.js')
    const claudeInput = {
      policyType: 'general_liability',
      deductibleStated: false,
      coverages: coverageRuleSets.general_liability.map((r) => ({ name: r.name, found: true, limit: '$1,000,000', confidence: 'high' })),
      gaps: gapRuleSets.general_liability.map((r) => ({ name: r.name, found: true })),
      questionsToAsk: ['q'],
      strengths: ['s'],
    }
    const result = mapClaudeResultToAnalysis(claudeInput, meta)
    const expectedScore = computeCoverageScore({
      foundCoverageCount: coverageRuleSets.general_liability.length,
      totalCoverageRules: coverageRuleSets.general_liability.length,
      foundGapProtections: gapRuleSets.general_liability.length,
      totalGapRules: gapRuleSets.general_liability.length,
    })
    expect(result.coverageScore).toBe(expectedScore)
    // general_liability has no Property Protection / Deductibles category.
    expect(result.scoreCategories.map((c) => c.name)).not.toContain('Deductibles')
    expect(result.scoreCategories.map((c) => c.name)).not.toContain('Property Protection')
    const expectedCategories = computeScoreCategories({
      type: 'general_liability',
      coverages: result.coverages,
      gaps: result.gaps,
      deductibleStated: false,
    })
    expect(result.scoreCategories).toEqual(expectedCategories)
  })
})
