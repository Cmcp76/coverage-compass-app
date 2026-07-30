import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  analyzeText,
  coverageRuleSets,
  detectPolicyType,
  extractNamedInsured,
  gapRuleSets,
  keywordIsPresent,
} from './policyAnalysis.js'

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
  renters: {
    file: 'renters-sample.txt',
    label: 'Renters',
    namedInsured: 'Jordan Ellis',
  },
}

describe('detectPolicyType', () => {
  for (const [key, { file, label }] of Object.entries(samples)) {
    it(`detects ${key} sample as "${label}"`, () => {
      expect(detectPolicyType(loadSample(file)).label).toBe(label)
    })
  }
})

describe('detectPolicyType tie-breaking', () => {
  it('favors renters over homeowners on a tied score, since renters-only terms are distinctive', () => {
    // Regression: homeowners was checked first in the signal list, so a tied
    // match count (common, since "loss of use"/"actual cash value" count
    // toward both) always resolved to homeowners, even when the text also
    // contained renters-exclusive terms like "tenant" and "renters policy".
    const text =
      'This renters policy covers your belongings. Loss of use is included if the ' +
      'rental becomes uninhabitable. Contents are valued at actual cash value. The tenant is the named insured.'
    expect(detectPolicyType(text).type).toBe('renters')
  })
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

  it('handles a space before the colon without leaving a stray ":"', () => {
    // Common in text extracted from PDF tables/columns, e.g. "Label : Value".
    expect(extractNamedInsured('Named Insured : John Doe')).toBe('John Doe')
  })

  it('handles no colon at all', () => {
    expect(extractNamedInsured('Named Insured John Doe')).toBe('John Doe')
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

  it('treats a contraction like "doesn\'t include X" as absent', () => {
    // Regression: \bnot\b doesn't match inside "doesn't" because \b treats
    // the apostrophe as a non-word boundary ("doesn" + "t"), so this
    // silently fell through to "present" before the fix.
    expect(
      keywordIsPresent("This policy doesn't include rental reimbursement.", [
        /rental reimbursement/i,
      ]),
    ).toBe(false)
  })

  it('treats "X isn\'t covered" (contraction after the keyword) as absent', () => {
    expect(keywordIsPresent("Roadside assistance isn't covered under this policy.", [
      /roadside assistance/i,
    ])).toBe(false)
  })

  it('treats "cannot" (no space before "not") as a negation', () => {
    // Regression: \bnot\b also requires a boundary before "not", which
    // "cannot" doesn't have, so this was missed the same way contractions were.
    expect(
      keywordIsPresent('This policy cannot cover flood damage.', [/flood damage/i]),
    ).toBe(false)
  })

  it('does not let a decimal point in a dollar amount pass for a sentence boundary', () => {
    // Regression: the sentence-boundary check treated the "." in "$1,500.00"
    // as ending the sentence, clipping the window before it ever reached the
    // negation a few words later.
    expect(
      keywordIsPresent('Rental Reimbursement: $1,500.00, not included with this policy.', [
        /rental reimbursement/i,
      ]),
    ).toBe(false)
  })
})

describe('coverage/gap rule sets stay conceptually distinct', () => {
  // Regression guard: this session found and fixed four cases (trucking,
  // then auto, general liability, and workers' comp) where a "gap" entry
  // used the exact same keyword as an existing "coverage" entry in the same
  // rule set, so the same real-world concept got reported twice, once as a
  // confirmed coverage and again as a gap worth confirming. An identical
  // regex .source shared between a rule set's coverages and gaps is the
  // precise signature of that bug, so fail loudly if it reappears.
  for (const type of Object.keys(coverageRuleSets)) {
    it(`${type}: no gap keyword duplicates a coverage keyword`, () => {
      const coverageSources = new Set(
        coverageRuleSets[type].flatMap((rule) => rule.keywords.map((k) => k.source)),
      )
      const gapSources = gapRuleSets[type].flatMap((rule) => rule.keywords.map((k) => k.source))
      const overlap = gapSources.filter((s) => coverageSources.has(s))
      expect(overlap).toEqual([])
    })
  }
})

describe('questionsToAsk always includes the closing exclusions question', () => {
  it('keeps the closing question even when every gap protection is missing', () => {
    // Regression: every rule set has exactly 4 gap entries, so when all 4
    // are "not found" the built list was 6 items (2 static + 4 gap-based)
    // before being sliced down to 5, silently dropping the final static
    // "exclusions" question, exactly when a sparse policy needed it most.
    const result = analyzeText('', { fileName: 'blank.txt' })
    expect(result.questionsToAsk).toHaveLength(5)
    expect(result.questionsToAsk).toContain('Are there any exclusions in my policy I should know about?')
  })
})

describe('buildStrengths phrasing', () => {
  it('does not falsely call rating factors and filings "coverage"', () => {
    const result = analyzeText(loadSample(samples.workersComp.file), { fileName: 'wc.txt' })
    expect(result.strengths).not.toContain('Your policy includes experience modifier coverage.')
    expect(result.strengths).not.toContain('Your policy includes class codes coverage.')
    expect(result.strengths.some((s) => s.includes('experience modifier'))).toBe(true)
    expect(result.strengths.some((s) => s.includes('class codes'))).toBe(true)
  })

  it('still calls genuine coverages "coverage" when the name lacks the word', () => {
    const result = analyzeText(loadSample(samples.auto.file), { fileName: 'auto.txt' })
    expect(result.strengths.some((s) => s.includes('bodily injury liability coverage'))).toBe(true)
  })

  it('preserves acronyms instead of mangling them into lowercase gibberish', () => {
    // Regression: a plain .toLowerCase() on "MC Authority / USDOT Status"
    // produced "mc authority / usdot status" - reads like a typo, not
    // deliberate lowercase, in an otherwise normal-prose sentence.
    const result = analyzeText(loadSample(samples.trucking.file), { fileName: 'trucking.txt' })
    expect(result.strengths.some((s) => s.includes('MC authority / USDOT status'))).toBe(true)
    expect(result.strengths.some((s) => s.includes('mc authority'))).toBe(false)
    expect(result.strengths.some((s) => s.includes('usdot'))).toBe(false)
  })

  it('preserves a meaningful single-letter designator like "Coverage A"', () => {
    // Regression: found via an end-to-end PDF download check after the
    // acronym fix above - "Workers' Compensation (Coverage A)" still came
    // out as "(coverage a)" because a lone uppercase letter didn't count as
    // an acronym under the original (letters.length > 1) heuristic. Here
    // "A"/"B" are meaningful part designators (same idea as Medicare Part
    // A/B), not just capitalized because they start a title. "coverage"
    // itself still lowercases normally since it's an ordinary word, not an
    // acronym - only the designator letter is preserved.
    const result = analyzeText(loadSample(samples.workersComp.file), { fileName: 'wc.txt' })
    expect(result.strengths.some((s) => s.includes('(coverage A)'))).toBe(true)
    expect(result.strengths.some((s) => s.includes('(coverage B)'))).toBe(true)
    expect(result.strengths.some((s) => s.includes('coverage a)'))).toBe(false)
    expect(result.strengths.some((s) => s.includes('coverage b)'))).toBe(false)
  })
})

describe('scoreCategories omits inapplicable checks per line of business', () => {
  it('does not score Property Protection or Deductibles for general liability', () => {
    const result = analyzeText(loadSample(samples.generalLiability.file), { fileName: 'gl.txt' })
    const names = result.scoreCategories.map((c) => c.name)
    expect(names).not.toContain('Property Protection')
    expect(names).not.toContain('Deductibles')
  })

  it('does not score Property Protection or Deductibles for workers comp', () => {
    const result = analyzeText(loadSample(samples.workersComp.file), { fileName: 'wc.txt' })
    const names = result.scoreCategories.map((c) => c.name)
    expect(names).not.toContain('Property Protection')
    expect(names).not.toContain('Deductibles')
  })

  it('still scores Property Protection and Deductibles for auto, homeowners, trucking, and renters', () => {
    for (const key of ['auto', 'homeowners', 'trucking', 'renters']) {
      const { file } = samples[key]
      const result = analyzeText(loadSample(file), { fileName: file })
      const names = result.scoreCategories.map((c) => c.name)
      expect(names).toContain('Property Protection')
      expect(names).toContain('Deductibles')
    }
  })
})

describe('limit extraction does not swallow a trailing comma', () => {
  it('stops at the amount when followed directly by a comma clause', () => {
    // Regression: [\d,]+ happily consumed a comma with no digit after it,
    // e.g. "$40,000, $500 deductible" extracted as "$40,000," instead of
    // "$40,000". Found via the renters sample, but the flaw was latent in
    // every limitPattern in the file.
    const result = analyzeText(
      'This tenant renters policy: Coverage C - Personal Property $40,000, $500 deductible',
      { fileName: 'test.txt' },
    )
    const personalProperty = result.coverages.find((c) => c.name === 'Personal Property')
    expect(personalProperty.limit).toBe('$40,000')
  })
})

describe('scoreCategories Deductibles check is negation-aware', () => {
  it('does not score Deductibles as "good" when the policy says it has none', () => {
    // Regression: this check used a bare /deductible/i.test(text) instead of
    // routing through keywordIsPresent(), so "does not include a deductible"
    // scored the same as an affirmative mention.
    const result = analyzeText(
      'Collision Coverage $25,000. This policy does not include a deductible.',
      { fileName: 'test.txt' },
    )
    const deductibles = result.scoreCategories.find((c) => c.name === 'Deductibles')
    expect(deductibles.status).toBe('review')
  })

  it('still scores Deductibles as "good" for a plain affirmative mention', () => {
    const result = analyzeText(loadSample(samples.auto.file), { fileName: samples.auto.file })
    const deductibles = result.scoreCategories.find((c) => c.name === 'Deductibles')
    expect(deductibles.status).toBe('good')
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
