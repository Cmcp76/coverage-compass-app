// Client-side, keyword-based policy analysis. This is NOT real document
// understanding, it's a rules-based fallback engine: Upload.jsx tries the
// real LLM-backed analysis (src/lib/analyzeWithLLM.js) first and only falls
// back to this local keyword matcher if that request fails, so the app
// still works end-to-end with no backend reachable.
//
// Detects the LINE OF BUSINESS from the document text (auto, homeowners,
// general liability, workers' compensation, or trucking) and applies the
// matching coverage/gap rule set, instead of always assuming personal auto.
// The rule sets themselves live in policyDomainKnowledge.js, shared with
// the server-side LLM analysis worker so both engines agree on what each
// coverage/gap means and compute the coverageScore the same way.

import {
  coverageRuleSets,
  gapRuleSets,
  computeScoreCategories,
  computeCoverageScore,
} from './policyDomainKnowledge.js'

export { coverageRuleSets, gapRuleSets }

// ---------- Negation-aware keyword matching ----------

// A bare regex.test() treats "does not include rental reimbursement" the
// same as "includes rental reimbursement" - it only checks the words are
// present, not whether the sentence is negating them. That's a real
// accuracy problem for a tool whose whole premise is telling someone what
// their policy does and doesn't cover. Negation shows up on either side of
// the keyword in natural phrasing ("does not include X" vs "X is not
// included" / "X is excluded"), so check a short window on both sides of
// each match before counting it as "found."
// \b treats the apostrophe in a contraction as a non-word boundary, so
// \bnot\b alone misses "doesn't"/"isn't"/"wasn't" (tokenizes as "doesn" +
// "t") and \bnot\b also can't match "not" glued onto "cannot" with no space
// before it - both are common negation phrasings in real policy language,
// so match them explicitly.
const NEGATION_PATTERN = /\b(not|no|without|excludes?|excluding|excluded|except|cannot)\b|n't\b/i
// Generous on purpose: each window is already clipped to the current
// sentence below, so this only needs to be wide enough to span a full
// sentence, not tight enough to avoid bleeding into the next one.
const NEGATION_WINDOW = 80
// A period only counts as a sentence boundary when it's not a decimal point
// inside a dollar amount (e.g. "$1,500.00"), otherwise the window clips
// right before a later negation ("...$1,500.00, not included.") and the
// negation never gets inspected.
const SENTENCE_END = /\.(?!\d)|\n/g

export function keywordIsPresent(text, keywords) {
  for (const keyword of keywords) {
    const flags = keyword.flags.includes('g') ? keyword.flags : keyword.flags + 'g'
    const globalKeyword = new RegExp(keyword.source, flags)
    for (const match of text.matchAll(globalKeyword)) {
      // Clip each window to the current sentence, a raw character count
      // bleeds into the *next* sentence for short lines ("Cargo Coverage
      // $100,000\n\nThis policy does not include...") and wrongly blames an
      // unrelated negation on this match.
      let before = text.slice(Math.max(0, match.index - NEGATION_WINDOW), match.index)
      let sentenceStart = -1
      for (const boundary of before.matchAll(SENTENCE_END)) sentenceStart = boundary.index
      if (sentenceStart !== -1) before = before.slice(sentenceStart + 1)

      const matchEnd = match.index + match[0].length
      let after = text.slice(matchEnd, matchEnd + NEGATION_WINDOW)
      const sentenceEnd = after.search(SENTENCE_END)
      if (sentenceEnd !== -1) after = after.slice(0, sentenceEnd)

      if (!NEGATION_PATTERN.test(before) && !NEGATION_PATTERN.test(after)) return true
    }
  }
  return false
}

// ---------- Policy type detection ----------

const policyTypeSignals = [
  {
    type: 'trucking',
    label: 'Trucking / Motor Carrier',
    keywords: [/usdot/i, /\bmc\s*(number|authority)\b/i, /motor carrier/i, /bobtail/i, /non-?trucking liability/i, /cargo (coverage|insurance)/i, /boc-?3/i, /fmcsa/i],
  },
  {
    type: 'workers_comp',
    label: "Workers' Compensation",
    keywords: [/workers'?\s*compensation/i, /workers'?\s*comp\b/i, /employer'?s liability/i, /experience mod(ifier)?\b/i, /class code/i, /payroll exposure/i],
  },
  {
    type: 'general_liability',
    label: 'Commercial General Liability',
    keywords: [/general liability/i, /\bCGL\b/i, /completed operations/i, /premises (liability|operations)/i, /additional insured/i, /certificate of insurance/i, /products liability/i],
  },
  {
    type: 'renters',
    label: 'Renters',
    // A renters (HO-4) policy shares vocabulary with homeowners (loss of
    // use, actual cash value), so these lean on what's actually distinct:
    // no dwelling of your own to insure, someone else's building instead.
    // Checked before homeowners below so that a tied score (common, since
    // the shared vocabulary counts toward both) favors renters: these
    // keywords (tenant, renters policy, HO-4) essentially never appear in a
    // genuine homeowners policy, so a tie means the renters-only terms are
    // real signal, not homeowners vocabulary being mistaken for it.
    keywords: [/renters?\s*insurance/i, /renters?\s*policy/i, /\bho-?4\b/i, /\btenant\b/i, /landlord'?s (policy|building|dwelling)/i],
  },
  {
    type: 'homeowners',
    label: 'Homeowners',
    keywords: [/dwelling coverage/i, /loss of use/i, /other structures/i, /homeowners? policy/i, /replacement cost/i, /actual cash value/i],
  },
  {
    type: 'auto',
    label: 'Personal / Commercial Auto',
    keywords: [/bodily injury/i, /collision coverage/i, /comprehensive coverage/i, /uninsured motorist/i, /liability limits?/i],
  },
]

export function detectPolicyType(text) {
  let best = { type: 'auto', label: 'Personal / Commercial Auto', score: 0 }
  for (const signal of policyTypeSignals) {
    const matches = signal.keywords.filter((k) => k.test(text)).length
    if (matches > best.score) {
      best = { type: signal.type, label: signal.label, score: matches }
    }
  }
  return best
}

// ---------- Main entry point ----------

// Declarations pages almost always label this field explicitly, so a
// direct "Named Insured:" match is far more reliable than trying to guess
// a person/business name out of free text.
// PDF text extraction frequently leaves a space before the colon in
// "Label : Value" layouts (columnar/table-derived text), which the previous
// pattern didn't account for, it left a stray leading ":" in the captured
// name. Consuming whitespace on both sides of the optional colon fixes it
// without breaking the no-colon-at-all case.
const NAMED_INSURED_PATTERN = /named insured\s*:?\s*([^\n]+)/i

export function extractNamedInsured(text) {
  const match = text.match(NAMED_INSURED_PATTERN)
  return match ? match[1].trim().replace(/\s{2,}/g, ' ') : null
}

export function analyzeText(rawText, meta = {}) {
  const text = rawText || ''
  const detected = detectPolicyType(text)
  const coverageRules = coverageRuleSets[detected.type]
  const gapRules = gapRuleSets[detected.type]

  const coverages = coverageRules.map((rule) => {
    const found = keywordIsPresent(text, rule.keywords)
    const limitMatch = text.match(rule.limitPattern)
    return {
      name: rule.name,
      limit: found
        ? limitMatch
          ? limitMatch[1]
          : 'Mentioned, limit not clearly detected'
        : 'NEEDED INFORMATION',
      explanation: found
        ? rule.explanation
        : `${rule.explanation} Not found in the uploaded document.`,
      confidence: found ? (limitMatch ? 'high' : 'medium') : 'missing',
    }
  })

  const gaps = gapRules
    .map((rule) => {
      const found = keywordIsPresent(text, rule.keywords)
      return {
        name: rule.name,
        icon: rule.icon,
        what: rule.what,
        why: rule.why,
        status: found ? 'Worth Confirming' : 'Not Found in Policy',
        found,
      }
    })
    .sort((a, b) => Number(a.found) - Number(b.found))

  const foundCoverageCount = coverages.filter((c) => c.confidence !== 'missing').length
  const foundGapProtections = gaps.filter((g) => g.found).length

  const coverageScore = computeCoverageScore({
    foundCoverageCount,
    totalCoverageRules: coverageRules.length,
    foundGapProtections,
    totalGapRules: gapRules.length,
  })

  const scoreCategories = computeScoreCategories({
    type: detected.type,
    coverages,
    gaps,
    deductibleStated: keywordIsPresent(text, [/deductible/i]),
  })

  return {
    fileName: meta.fileName || 'uploaded document',
    // A raw ISO timestamp, not a pre-formatted display string - this ran
    // through toLocaleDateString('en-US', ...) directly here before, so a
    // Spanish-speaking user always saw an English-formatted date no matter
    // what language they'd chosen. Every consumer formats it at render time
    // via useLocaleFormat().formatShortDate() instead, matching the app's
    // active language.
    analyzedAt: new Date().toISOString(),
    hasRealText: text.trim().length > 40,
    truncated: Boolean(meta.truncated),
    namedInsured: extractNamedInsured(text),
    detectedPolicyType: detected.label,
    coverageScore,
    coverages,
    gaps,
    scoreCategories,
    questionsToAsk: buildQuestions(gaps),
    strengths: buildStrengths(coverages),
    // Distinguishes this keyword-matching fallback from a real LLM-analyzed
    // result (worker/src/mapAnalysis.js sets 'llm') so the UI can be honest
    // about which one produced a given review - the two have meaningfully
    // different accuracy, and a person switching between "backend was
    // reachable" and "backend was down, here's the fallback" shouldn't be
    // left to guess which kind of review they're looking at.
    analysisSource: 'fallback',
  }
}

// A plain .toLowerCase() on a rule name like "MC Authority / USDOT Status"
// or "Hired & Non-Owned Auto Liability (HNOA)" mangles the acronyms into
// "mc authority / usdot status" / "...(hnoa)" - readable as a typo, not a
// deliberate lowercase, in a sentence otherwise written in normal prose.
// Lowercase every token except ones whose letters are already all-uppercase
// (an acronym), so "MC"/"USDOT"/"HNOA"/"BOC-3" survive untouched while
// ordinary title-cased words like "Authority" or "Status" still lowercase
// normally to fit the surrounding sentence. Single uppercase letters count
// too - "Workers' Compensation (Coverage A)" has a meaningful "A"/"B" part
// designator, not just a capitalized word, so "(coverage a)" reads as
// wrong/truncated the same way a mangled acronym does.
export function lowercaseExceptAcronyms(name) {
  return name
    .split(/(\s+)/)
    .map((token) => {
      const letters = token.replace(/[^A-Za-z]/g, '')
      const isAcronym = letters.length > 0 && letters === letters.toUpperCase()
      return isAcronym ? token : token.toLowerCase()
    })
    .join('')
}

function buildQuestions(gaps) {
  // Capped at 3 gap-based questions, not 4: every rule set has exactly 4 gap
  // entries, and the two static bookend questions below always need a slot
  // each within a 5-question list. Slicing to 4 gap questions here used to
  // silently drop the closing "exclusions" question whenever a policy had
  // every gap protection missing, exactly the policy that most needed it.
  const notFound = gaps.filter((g) => !g.found).slice(0, 3)
  const base = notFound.map((g) => `Would ${lowercaseExceptAcronyms(g.name)} make sense for my situation?`)
  return [
    'Do I have enough liability protection given my exposure?',
    ...base,
    'Are there any exclusions in my policy I should know about?',
  ]
}

function buildStrengths(coverages) {
  const found = coverages.filter((c) => c.confidence !== 'missing')
  if (found.length === 0) {
    return [
      'We were able to open your document, but couldn\u2019t confidently identify specific coverages. A licensed insurance professional can review the original document with you.',
    ]
  }
  // A handful of rule entries (rating factors, filings, credential status)
  // aren't actually "coverage" in the insurance sense, e.g. Experience
  // Modifier or Class Codes, so blindly appending "coverage" to any name
  // that lacks the word produces false claims like "your policy includes
  // experience modifier coverage." Skip the suffix for those too.
  const NOT_COVERAGE = /\b(limit|modifier|codes?|status|exposure|authority)\b/i
  return found.map((c) => {
    const label = lowercaseExceptAcronyms(c.name)
    const suffix = /coverage/i.test(label) || NOT_COVERAGE.test(label) ? '' : ' coverage'
    return `Your policy includes ${label}${suffix}${c.confidence === 'high' ? ` (${c.limit})` : ''}.`
  })
}
