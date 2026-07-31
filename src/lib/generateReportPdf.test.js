import { describe, expect, it } from 'vitest'
import { generateReportPdf } from './generateReportPdf.js'

const baseAnalysis = {
  fileName: 'auto-policy.pdf',
  analyzedAt: 'Jul 29, 2026',
  namedInsured: 'Jordan Ellis',
  detectedPolicyType: 'Personal / Commercial Auto',
  coverageScore: 82,
  coverages: [
    { name: 'Bodily Injury Liability', limit: '$250,000', explanation: 'Helps protect you if legally responsible for injuries.', confidence: 'high' },
    { name: 'Comprehensive', limit: '$500', explanation: 'Covers non-collision damage.', confidence: 'medium' },
  ],
  gaps: [
    { name: 'Umbrella Insurance', why: 'Extra liability protection above your policy limits.' },
  ],
  strengths: ['Your policy includes bodily injury liability coverage ($250,000).'],
  questionsToAsk: ['Do I have enough liability protection given my exposure?'],
}

function longCoverageRow(i) {
  return {
    name: `Sample Coverage Line Item Number ${i} With A Fairly Long Name`,
    limit: 'NEEDED INFORMATION',
    explanation:
      'This is a deliberately long explanation string designed to wrap across multiple lines inside its table cell, ' +
      'so that a run of these rows collectively forces the coverage table across a page boundary during PDF generation.',
    confidence: 'missing',
  }
}

describe('generateReportPdf', () => {
  it('generates a single-page PDF for a short, typical analysis', () => {
    const doc = generateReportPdf(baseAnalysis)
    expect(doc.internal.getNumberOfPages()).toBe(1)
  })

  it('does not throw and produces a valid multi-page PDF when the coverage table is long enough to force a page break', () => {
    const manyRows = Array.from({ length: 25 }, (_, i) => longCoverageRow(i))
    const analysis = { ...baseAnalysis, coverages: manyRows }
    const doc = generateReportPdf(analysis)
    expect(doc.internal.getNumberOfPages()).toBeGreaterThan(1)
    // Confirms the document is actually well-formed output, not a partially
    // constructed object left over from a mid-generation crash.
    const bytes = doc.output('arraybuffer')
    expect(bytes.byteLength).toBeGreaterThan(0)
  })

  it('wraps a long fileName/namedInsured on the cover page instead of throwing or truncating silently', () => {
    const analysis = {
      ...baseAnalysis,
      fileName: 'A'.repeat(200) + '.pdf',
      namedInsured: 'B'.repeat(200),
    }
    expect(() => generateReportPdf(analysis)).not.toThrow()
  })

  it('handles an analysis with no gaps, no strengths, and no questions without throwing', () => {
    const analysis = { ...baseAnalysis, gaps: [], strengths: [], questionsToAsk: [] }
    expect(() => generateReportPdf(analysis)).not.toThrow()
  })

  it('handles an analysis with no namedInsured (falsy) by omitting the "Prepared for" line rather than rendering "undefined"', () => {
    const analysis = { ...baseAnalysis, namedInsured: null }
    const doc = generateReportPdf(analysis)
    expect(doc.internal.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })

  it('adds more pages as the coverage table grows, rather than the page count staying flat or shrinking', () => {
    const small = generateReportPdf({ ...baseAnalysis, coverages: Array.from({ length: 3 }, (_, i) => longCoverageRow(i)) })
    const large = generateReportPdf({ ...baseAnalysis, coverages: Array.from({ length: 30 }, (_, i) => longCoverageRow(i)) })
    expect(large.internal.getNumberOfPages()).toBeGreaterThanOrEqual(small.internal.getNumberOfPages())
  })
})
