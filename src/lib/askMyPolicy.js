// "Ask My Policy" - a client-side, keyword-matching Q&A engine that answers
// only from the structured data already in the analysis object (coverages,
// gaps, namedInsured, detectedPolicyType, coverageScore, scoreCategories).
// This is deliberately NOT a general insurance chatbot and does not call an
// LLM - every answer is grounded in a specific field of the document that
// was actually analyzed, so it can never invent a coverage detail that
// isn't there. If/when the live analysis Worker is available, this can be
// swapped for a request to it without changing the caller's contract
// (still takes a question + analysis, still returns a typed result).

const STOPWORDS = new Set([
  'do', 'i', 'have', 'has', 'is', 'are', 'am', 'what', 'whats', "what's", 'my', 'the', 'a', 'an',
  'for', 'does', 'on', 'in', 'of', 'to', 'this', 'that', 'it', 'if', 'was', 'were', 'will', 'can',
  'could', 'would', 'should', 'me', 'you', 'your', 'please', 'tell', 'much', 'many', 'how', 'when',
  'where', 'who', 'which', 'policy', 'insurance', 'coverage', 'and', 'or', 'with',
])

// Meta-questions Coverage Compass can't honestly answer from a document
// review - shopping/legal/financial advice, not a lookup against what's
// actually in the policy. Redirected to a licensed professional instead of
// guessed at. Includes Spanish phrasings so a Spanish-speaking user gets the
// same redirect, not a silent English-only miss.
const OUT_OF_SCOPE_PATTERNS = [
  /switch (carriers?|companies?|insurers?)/i,
  /\b(should|do) i (switch|change|cancel)\b/i,
  /cancel (my|this) policy/i,
  /(best|cheapest|good) (insurance )?(carrier|company|insurer|deal|price|rate)/i,
  /how much (should|will) i pay/i,
  /recommend (a|an|which) (carrier|company|insurer)/i,
  /(sue|lawsuit|legal advice|attorney|lawyer)/i,
  /is this (a )?good (deal|policy|price)/i,
  /cambiar de (aseguradora|compañ[ií]a)/i,
  /(deber[ií]a) (cambiar|cancelar)/i,
  /cancelar (mi|esta) p[oó]liza/i,
  /(mejor|m[aá]s barata) (aseguradora|compañ[ií]a|tarifa)/i,
  /(demandar|abogado|asesor[ií]a legal)/i,
]

// English and Spanish phrasings of the same handful of questions the
// analysis object can answer directly (not via the fuzzy coverage/gap
// matcher below, which only works against the always-English coverage
// facts - see the Spanish-detection guard further down).
const DEDUCTIBLE_PATTERN = /deductibl|deducible/i
const NAMED_INSURED_PATTERN =
  /(named insured|whose name|who is (the )?insured|policyholder|policy ?holder|asegurado nombrado|nombre del asegurado|qui[eé]n es el asegurado|titular de la p[oó]liza)/i
const POLICY_TYPE_PATTERN = /(what (kind|type) of policy|qu[eé] tipo de p[oó]liza|qu[eé] clase de p[oó]liza)/i
const SCORE_PATTERN =
  /(coverage score|my score|how (good|bad) is my (policy|coverage)|puntaje de cobertura|mi puntaje)/i

// The fuzzy coverage/gap matcher below only works against English text
// (coverage/gap names and explanations are always in English, matching how
// the rest of the app already displays them regardless of UI language - see
// AIReview.jsx). Matching Spanish question words against that English
// corpus produces false-positive matches on coincidental substrings rather
// than real answers, so a Spanish-looking question that isn't one of the
// specific patterns above goes straight to the honest "I don't see that"
// fallback instead of risking a wrong match.
const SPANISH_HINT_PATTERN =
  /[¿¡]|\b(qu[eé]|cu[aá]l|c[oó]mo|d[oó]nde|cu[aá]ndo|tengo|tiene|est[aá]|aseguradora|p[oó]liza|cu[aá]nto|incluye)\b/i

function tokenize(question) {
  return question
    .toLowerCase()
    .replace(/[?.!,]/g, '')
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word))
}

// Strips the "Not found in the uploaded document." sentence a missing
// coverage's explanation carries (as a trailing suffix from analyzeText(),
// or a leading sentence in the sample/demo data's hand-written text), so
// the caller can lead with its own "I don't see X" framing without saying
// "not found" twice.
export function baseExplanation(explanation) {
  return explanation.replace(/\s*Not found in the uploaded document\.\s*/, ' ').trim()
}

export function answerQuestion(question, analysis) {
  const q = (question || '').trim()
  if (!q) return { kind: 'unmatched' }

  if (OUT_OF_SCOPE_PATTERNS.some((p) => p.test(q))) return { kind: 'out-of-scope' }

  if (DEDUCTIBLE_PATTERN.test(q)) {
    const cat = (analysis.scoreCategories || []).find((c) => c.name === 'Deductibles')
    if (cat) return { kind: 'deductible', data: { status: cat.status } }
  }

  if (NAMED_INSURED_PATTERN.test(q)) {
    if (analysis.namedInsured) return { kind: 'namedInsured', data: { namedInsured: analysis.namedInsured } }
    return { kind: 'unmatched' }
  }

  if (POLICY_TYPE_PATTERN.test(q)) {
    return { kind: 'policyType', data: { detectedPolicyType: analysis.detectedPolicyType } }
  }

  if (SCORE_PATTERN.test(q)) {
    return { kind: 'score', data: { coverageScore: analysis.coverageScore } }
  }

  if (SPANISH_HINT_PATTERN.test(q)) return { kind: 'unmatched' }

  const tokens = tokenize(q)
  if (tokens.length === 0) return { kind: 'unmatched' }
  // A single word in common (e.g. "car" coincidentally appearing in the
  // Rental Reimbursement explanation for a "what color is my car" question)
  // is too weak to confidently ground a multi-word question - require at
  // least two overlapping meaningful words once there's more than one to
  // work with, so a topically unrelated question falls through to the
  // honest "I don't see that" fallback instead of a confident-looking but
  // wrong answer.
  const minScore = tokens.length === 1 ? 1 : 2

  let best = null
  for (const cov of analysis.coverages || []) {
    const corpus = `${cov.name} ${cov.explanation}`.toLowerCase()
    const score = tokens.filter((t) => corpus.includes(t)).length
    if (score >= minScore && (!best || score > best.score)) {
      best = { score, kind: cov.confidence === 'missing' ? 'coverage-missing' : 'coverage-found', data: { coverage: cov } }
    }
  }
  for (const gap of analysis.gaps || []) {
    const corpus = `${gap.name} ${gap.what} ${gap.why}`.toLowerCase()
    const score = tokens.filter((t) => corpus.includes(t)).length
    if (score >= minScore && (!best || score > best.score)) {
      best = { score, kind: gap.found ? 'gap-found' : 'gap-missing', data: { gap } }
    }
  }

  return best ? { kind: best.kind, data: best.data } : { kind: 'unmatched' }
}
