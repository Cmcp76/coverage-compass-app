// Claude tool-use schema for structured policy analysis output. Using a
// forced tool call (not free-text parsing) means the response is always
// valid JSON matching this shape, no regex-scraping a chat reply.

export const ANALYSIS_TOOL = {
  name: 'submit_policy_analysis',
  description:
    'Submit the structured analysis of an uploaded insurance policy document, based only on what is actually stated in the provided text. Do not invent limits, coverages, or facts not present in the document.',
  input_schema: {
    type: 'object',
    properties: {
      policyType: {
        type: 'string',
        enum: ['auto', 'homeowners', 'renters', 'general_liability', 'workers_comp', 'trucking'],
        description: 'The single best-matching line of business for this document.',
      },
      namedInsured: {
        type: ['string', 'null'],
        description:
          'The named insured exactly as it appears in the document (usually on a declarations page), or null if it cannot be determined.',
      },
      deductibleStated: {
        type: 'boolean',
        description: 'True if the document clearly states a deductible amount for at least one relevant coverage.',
      },
      coverages: {
        type: 'array',
        description:
          'One entry for EVERY coverage in the rule set provided below for the identified policyType, in the same order, even ones not found in the document.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Must exactly match one of the coverage names in the provided rule set.' },
            found: { type: 'boolean' },
            limit: {
              type: ['string', 'null'],
              description:
                'The dollar limit or deductible exactly as stated in the document, e.g. "$250,000 / $500,000". Null if not found, or found but the limit is unclear.',
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'missing'],
              description: 'high = found with a clear limit. medium = mentioned but limit unclear. missing = not found in the document at all.',
            },
          },
          required: ['name', 'found', 'confidence'],
        },
      },
      gaps: {
        type: 'array',
        description: 'One entry for EVERY gap in the rule set provided below for the identified policyType, in the same order.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Must exactly match one of the gap names in the provided rule set.' },
            found: {
              type: 'boolean',
              description: 'true if this coverage/topic is mentioned anywhere in the document (even with unclear details), false if not mentioned at all.',
            },
          },
          required: ['name', 'found'],
        },
      },
      questionsToAsk: {
        type: 'array',
        items: { type: 'string' },
        description:
          '3 to 5 specific, plain-language questions this person should ask their insurance professional, tailored to what was actually found or missing in THIS document. Do not invent generic questions unrelated to this policy.',
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description:
          '2 to 4 genuine, specific positive observations about this policy, based only on what is actually present in the document. If nothing stands out, return fewer items rather than inventing praise.',
      },
    },
    required: ['policyType', 'coverages', 'gaps', 'questionsToAsk', 'strengths'],
  },
}
