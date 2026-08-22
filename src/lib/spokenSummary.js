// Builds the plain-language script used by "Explain My Coverage" - both as
// the SpeechSynthesis utterance text and as the visible transcript. There's
// no single pre-generated "summary paragraph" anywhere in the analysis
// object, so this composes one from the same structured fields the rest of
// the app already renders (coverages, strengths, gaps, scoreCategories),
// rather than inventing new facts the analysis didn't produce.

function joinWithAnd(parts) {
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

export function buildSpokenSummary(analysis) {
  const sentences = []

  sentences.push(`Here's a plain-language summary of your ${analysis.detectedPolicyType} policy.`)
  sentences.push(
    `Your Coverage Score is ${analysis.coverageScore} out of 100 — an educational snapshot, not a guarantee.`,
  )

  const tierCounts = { good: 0, review: 0, gap: 0 }
  for (const cat of analysis.scoreCategories || []) {
    if (cat.status in tierCounts) tierCounts[cat.status] += 1
  }
  const tierParts = []
  if (tierCounts.good) tierParts.push(`${tierCounts.good} strong`)
  if (tierCounts.review) tierParts.push(`${tierCounts.review} worth a review`)
  if (tierCounts.gap) tierParts.push(`${tierCounts.gap} potential ${tierCounts.gap === 1 ? 'gap' : 'gaps'}`)
  if (tierParts.length) {
    sentences.push(
      `Across ${analysis.scoreCategories.length} protection areas, that breaks down to ${joinWithAnd(tierParts)}.`,
    )
  }

  if (analysis.strengths?.length) {
    sentences.push(`Here's what looks solid: ${analysis.strengths.join(' ')}`)
  }

  const notFound = (analysis.gaps || []).filter((g) => !g.found).slice(0, 3)
  if (notFound.length) {
    sentences.push(
      `A few coverage areas worth asking your insurance professional about: ${notFound.map((g) => g.name).join(', ')}.`,
    )
  }

  sentences.push(
    'This is an educational summary, not a guarantee, and it is not a substitute for advice from a licensed insurance professional.',
  )

  return sentences
}
