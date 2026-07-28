import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { analyzeText, detectPolicyType, extractNamedInsured, keywordIsPresent } from './policyAnalysis.js'

const samplesDir = fileURLToPath(new URL('../../sample-policies/', import.meta.url))

function loadSample(name) {
  return readFileSync(samplesDir + name, 'utf-8')
}

const samples = {
  auto: { file: 'auto-sample.txt', label: 'Personal / Commercial Auto', namedInsured: 'Maria Alvarez' },
  homeowners: { file: 'homeowners-sample.txt', label: 'Homeowners', namedInsured: 'John and Priya Patel' },
  generalLiability: {
    file: 'general-liability-sample.txt',
    label: 'Commercial General Liability',
    namedInsured: 'Alvarez Consulting LLC',
  },
  trucking: {
    file: 'trucking-sample.txt',
    label: 'Trucking / Motor Carrier',
    namedInsured: 'Alvarez Trucking LLC',
  },
  workersComp: {
    file: 'workers-comp-sample.txt',
    label: "Workers' Compensation",
    namedInsured: 'Alvarez Construction Inc.',
  },
}

describe('detectPolicyType', () => {
  for (const [key, { file, label }] of Object.entries(samples)) {
    it(`detects ${key} sample as "${label}"`, () => {
      expect(detectPolicyType(loadSample(file)).label).toBe(label)
    })
  }
})

describe('extractNamedInsured', () => {
  for (const [key, { file, namedInsured }] of Object.entries(samples)) {
    it(`extracts the named insured from the ${key} sample`, () => {
      expect(extractNamedInsured(loadSample(file))).toBe(namedInsured)
    })
  }

  it('returns null when no "Named Insured:" line is present', () => {
    expect(extractNamedInsured('This document has no such field.')).toBeNull()
  })
})

describe('keywordIsPresent negation handling', () => {
  // These are the exact regression scenarios found and fixed this session,
  // pinned here so a future edit to the negation window can't silently
  // reintroduce them.
  it('treats "does not include X" (negation before the keyword) as absent', () => {
    expect(
      keywordIsPresent('This policy does not include rental reimbursement.', [/rental reimbursement/i]),
    ).toBe(false)
  })

  it('treats "X is not included" (negation after the keyword) as absent', () => {
    expect(keywordIsPresent('Flood coverage is not included.', [/flood coverage/i])).toBe(false)
  })

  it('treats "X is excluded" (negation after the keyword) as absent', () => {
    expect(
      keywordIsPresent('Waiver of subrogation is excluded from this policy.', [/waiver of subrogation/i]),
    ).toBe(false)
  })

  it('does not let negation in an unrelated later sentence bleed backward', () => {
    // Regression: a fixed-width window used to let a *different* clause's
    // negation ("does not include...") wrongly negate an unrelated,
    // already-affirmed keyword earlier in the text.
    const text = 'Cargo Coverage $100,000\n\nThis policy does not include bobtail coverage.'
    expect(keywordIsPresent(text, [/cargo coverage/i])).toBe(true)
  })

  it('still finds a plain affirmative match with no negation nearby', () => {
    expect(keywordIsPresent('Comprehensive $500 deductible', [/comprehensive/i])).toBe(true)
  })
})

describe('analyzeText, full pipeline against real sample policies', () => {
  for (const [key, { file, label, namedInsured }] of Object.entries(samples)) {
    it(`produces a sane, internally consistent analysis for the ${key} sample`, () => {
      const result = analyzeText(loadSample(file), { fileName: file })

      expect(result.detectedPolicyType).toBe(label)
      expect(result.namedInsured).toBe(namedInsured)
      expect(result.hasRealText).toBe(true)
      expect(result.coverageScore).toBeGreaterThanOrEqual(20)
      expect(result.coverageScore).toBeLessThanOrEqual(98)
      expect(result.coverages.length).toBeGreaterThan(0)
      expect(result.gaps.length).toBeGreaterThan(0)
      expect(result.questionsToAsk.length).toBeGreaterThan(0)

      // "Not found" gaps should always sort ahead of confirmed/found ones,
      // since Dashboard/Notifications surface gaps[0] as the headline alert.
      const foundFlags = result.gaps.map((g) => g.found)
      const firstFoundIndex = foundFlags.indexOf(true)
      if (firstFoundIndex !== -1) {
        expect(foundFlags.slice(0, firstFoundIndex).every((f) => f === false)).toBe(true)
      }
    })
  }

  it('falls back to demo-safe values for empty text', () => {
    const result = analyzeText('', { fileName: 'blank.txt' })
    expect(result.hasRealText).toBe(false)
    expect(result.namedInsured).toBeNull()
    expect(result.coverages.every((c) => c.confidence === 'missing')).toBe(true)
  })
})
