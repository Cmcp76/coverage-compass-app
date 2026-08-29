// Maps Claude's structured tool-use output onto the exact analysis object
// shape the app already expects (see src/lib/policyAnalysis.js's
// analyzeText()), so no downstream page needs to know or care whether an
// analysis came from the real LLM or the client-side fallback engine.
//
// Deliberately does NOT trust Claude for the coverage/gap *names*,
// *explanations*, the coverageScore formula, or the scoreCategories logic -
// those come from the shared, versioned rule sets in
// src/lib/policyDomainKnowledge.js. Claude's job is narrower and more
// reliable: read the actual document and say, for each item in a known
// list, whether it's there and what it says. That keeps the score
// deterministic and auditable instead of an opaque LLM-invented number, and
// means a hallucinated or malformed coverage name from the model just gets
// ignored rather than corrupting the UI.

import {
  coverageRuleSets,
  gapRuleSets,
  labelForType,
  computeScoreCategories,
  computeCoverageScore,
} from '../../src/lib/policyDomainKnowledge.js'

const VALID_CONFIDENCE = new Set(['high', 'medium', 'missing'])

// Words too generic to count as a real signal that a strength sentence is
// talking about a specific gap item (nearly every gap name/explanation
// contains one of these).
const GENERIC_WORDS = new Set(['with', 'coverage', 'insurance', 'policy', 'that', 'this', 'your'])

function significantWords(name) {
  return name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3 && !GENERIC_WORDS.has(w))
}

// Guards against the LLM's own two outputs in a single response - the
// free-text strengths narrative and the structured gaps determination -
// disagreeing with each other, e.g. calling "Roadside Assistance" a
// strength ("included for both vehicles") while its own gaps output marked
// that same item not found. buildPrompt.js now asks the model not to do
// this, but nothing stops it from ignoring that instruction, so this is the
// backstop that keeps a self-contradicting report from ever reaching the
// user. Word-overlap rather than an exact name match, since the model's
// prose paraphrases the gap name ("Uninsured Motorist" for the rule name
// "Uninsured/Underinsured Motorist") rather than repeating it verbatim.
function contradictsNotFoundGap(strength, notFoundGapNames) {
  const lower = strength.toLowerCase()
  return notFoundGapNames.some((name) => {
    const words = significantWords(name)
    if (words.length === 0) return false
    const matches = words.filter((w) => lower.includes(w)).length
    return matches / words.length >= 0.6
  })
}

export function mapClaudeResultToAnalysis(claudeInput, meta = {}) {
  const input = claudeInput || {}
  const type = coverageRuleSets[input.policyType] ? input.policyType : 'auto'
  const coverageRules = coverageRuleSets[type]
  const gapRules = gapRuleSets[type]

  // Look up by name rather than assuming index-for-index correspondence -
  // Claude occasionally drops, reorders, or duplicates an entry, and a
  // by-name lookup degrades gracefully (missing entry -> "missing") instead
  // of silently misattributing one coverage's data to another.
  const claudeCoverageByName = new Map((Array.isArray(input.coverages) ? input.coverages : []).map((c) => [c?.name, c]))
  const coverages = coverageRules.map((rule) => {
    const c = claudeCoverageByName.get(rule.name)
    const found = Boolean(c?.found)
    const confidence = found && VALID_CONFIDENCE.has(c?.confidence) ? c.confidence : found ? 'medium' : 'missing'
    return {
      name: rule.name,
      limit: found ? c?.limit || 'Mentioned, limit not clearly detected' : 'NEEDED INFORMATION',
      explanation: found ? rule.explanation : `${rule.explanation} Not found in the uploaded document.`,
      confidence,
    }
  })

  const claudeGapByName = new Map((Array.isArray(input.gaps) ? input.gaps : []).map((g) => [g?.name, g]))
  const gaps = gapRules
    .map((rule) => {
      const found = Boolean(claudeGapByName.get(rule.name)?.found)
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
    type,
    coverages,
    gaps,
    deductibleStated: Boolean(input.deductibleStated),
  })

  const questionsToAsk =
    Array.isArray(input.questionsToAsk) && input.questionsToAsk.length
      ? input.questionsToAsk.filter((q) => typeof q === 'string' && q.trim()).slice(0, 5)
      : ['Are there any exclusions in my policy I should know about?']

  const notFoundGapNames = gaps.filter((g) => !g.found).map((g) => g.name)
  const strengths = Array.isArray(input.strengths)
    ? input.strengths
        .filter((s) => typeof s === 'string' && s.trim())
        .filter((s) => !contradictsNotFoundGap(s, notFoundGapNames))
        .slice(0, 4)
    : []

  return {
    fileName: meta.fileName || 'uploaded document',
    analyzedAt: new Date().toISOString(),
    hasRealText: Boolean(meta.hasRealText),
    truncated: Boolean(meta.truncated),
    namedInsured: typeof input.namedInsured === 'string' && input.namedInsured.trim() ? input.namedInsured.trim() : null,
    detectedPolicyType: labelForType(type),
    coverageScore,
    coverages,
    gaps,
    scoreCategories,
    questionsToAsk,
    strengths,
    // Lets the UI (Task 4 - privacy/trust copy) tell a person whether their
    // review came from real document analysis or the client-side fallback,
    // since the two have meaningfully different accuracy.
    analysisSource: 'llm',
  }
}
