// Builds the system prompt for the policy-analysis tool call. Grounds
// Claude in the exact same coverage/gap rule sets the client-side fallback
// engine uses (see src/lib/policyDomainKnowledge.js) rather than letting it
// invent its own vocabulary for coverage names - that keeps output stable
// enough for the mapping logic below to attach the app's static
// explanation/what/why copy by name, and keeps the two engines' idea of
// "what counts as a gap" consistent.

import { POLICY_TYPES, coverageRuleSets, gapRuleSets } from '../../src/lib/policyDomainKnowledge.js'

function describeRuleSet(type) {
  const label = POLICY_TYPES.find((p) => p.type === type)?.label || type
  const coverages = coverageRuleSets[type].map((c) => `    - "${c.name}": ${c.explanation}`).join('\n')
  const gaps = gapRuleSets[type].map((g) => `    - "${g.name}": ${g.what}`).join('\n')
  return `  ${type} (${label})\n  Coverages to check:\n${coverages}\n  Gaps to check:\n${gaps}`
}

export function buildSystemPrompt() {
  const ruleSets = POLICY_TYPES.map((p) => describeRuleSet(p.type)).join('\n\n')

  return `You are analyzing an uploaded insurance policy document for Coverage Compass, an educational tool that explains a policy in plain language. You are not providing legal, financial, or insurance advice, and your output is explicitly framed to the end user as an educational snapshot, not a professional review.

First, identify which ONE of these six lines of business the document is:

${ruleSets}

Then, using ONLY the rule set for the line of business you identified:
- For each coverage in that rule set's list, determine if it is found in the document, its stated limit (if any), and your confidence.
- For each gap in that rule set's list, determine if it is mentioned anywhere in the document (even briefly or unclearly) or not found at all.
- Use the coverage/gap names EXACTLY as given above - do not paraphrase or invent new names.
- Base every determination only on what the document text actually says. Do not guess or fabricate limits, dates, or named parties. If something is not in the document, mark it as not found rather than assuming a typical value.
- Write 3-5 questionsToAsk and 2-4 strengths that are specific to what you actually found in THIS document, not generic insurance advice.

Call the submit_policy_analysis tool with your findings.`
}
