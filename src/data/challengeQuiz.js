// Verbatim content from the Coverage Compass Challenge quiz copy doc.
// Do not paraphrase questions, options, or explanations here, only edit
// this file when the source copy doc changes.

export const challengeIntro = {
  headline: 'The Coverage Compass Challenge',
  subheadline:
    'Answer 10 quick questions about auto, home, and everyday coverage. Takes about 5 minutes — no policy upload required.',
  trustLine: 'No obligation. No sales calls. Just a clearer picture of what to ask about.',
  cta: 'Start the Challenge',
}

// `topic` is shown on the results screen only when this question is
// missed, it is not part of the quiz copy doc's question text.
export const challengeQuestions = [
  {
    id: 1,
    category: 'Liability Basics',
    question:
      "If you're at fault in a car accident and the other driver is injured, what does your Bodily Injury Liability coverage help pay for?",
    options: [
      'Repairs to your own car',
      "The other driver's medical bills and related costs",
      'Your own medical bills',
      'A rental car for you',
    ],
    correctIndex: 1,
    explanation:
      "Bodily Injury Liability covers costs to other people when you're at fault — medical bills, lost wages, and sometimes legal costs if you're sued. It doesn't cover your own car or injuries; that's a separate coverage.",
    topic: 'Bodily Injury Liability, and what it actually covers',
  },
  {
    id: 2,
    category: 'Comprehensive vs. Collision',
    question:
      'Your car is damaged when a tree branch falls on it during a storm. Which coverage typically handles this?',
    options: ['Collision', 'Comprehensive', 'Liability', 'Roadside Assistance'],
    correctIndex: 1,
    explanation:
      'Comprehensive covers non-collision events — weather, theft, vandalism, falling objects. Collision covers damage from hitting another vehicle or object. Easy to mix up, but the distinction matters at claim time.',
    topic: 'The difference between Comprehensive and Collision coverage',
  },
  {
    id: 3,
    category: 'Home: Replacement Cost vs. Actual Cash Value',
    question:
      'Your 10-year-old roof is damaged in a storm. If your policy pays "Actual Cash Value," what should you expect?',
    options: [
      'The full cost to install a brand-new roof',
      "The roof's value today, factoring in depreciation",
      'Nothing — ACV means no payout',
      'A cash advance before repairs begin',
    ],
    correctIndex: 1,
    explanation:
      'Actual Cash Value factors in depreciation, so an older roof pays out less than a brand-new one would cost to install. Replacement Cost policies pay to replace the item at today’s prices, without subtracting for age or wear. This is one of the most common points of confusion at claim time.',
    topic: 'Replacement Cost vs. Actual Cash Value on your home',
  },
  {
    id: 4,
    category: 'Renters Insurance',
    question:
      'You rent an apartment and your landlord has insurance on the building. Does that cover your personal belongings if there’s a fire?',
    options: [
      'Yes, the landlord’s policy covers everything inside your unit',
      'No — the landlord’s policy generally covers the building, not your personal property',
      'Only if you’ve lived there more than a year',
      'Only for items worth over $10,000',
    ],
    correctIndex: 1,
    explanation:
      'A landlord’s policy typically protects the structure itself, not a tenant’s belongings. That’s what renters insurance is for — and it’s often inexpensive relative to what it protects.',
    topic: 'Whether renters insurance makes sense for your belongings',
  },
  {
    id: 5,
    category: 'Liability Limits and Assets',
    question:
      'Why might someone with significant savings or home equity want higher liability limits or an umbrella policy?',
    options: [
      'It lowers their premium automatically',
      'Standard liability limits may not cover a large claim or lawsuit, leaving personal assets exposed',
      'It’s required by law once you own a home',
      'It only matters for business owners',
    ],
    correctIndex: 1,
    explanation:
      'If a claim or lawsuit exceeds your policy’s liability limit, you could be personally responsible for the difference. Higher limits or an umbrella policy add a layer of protection — worth a conversation with an insurance professional, especially as assets grow.',
    topic: 'Whether an umbrella policy fits your situation',
  },
  {
    id: 6,
    category: 'Rental Car Coverage',
    question:
      'Your car is in the shop for two weeks after a covered accident. Without rental reimbursement coverage, who typically pays for a rental car?',
    options: [
      'Your auto insurance company automatically',
      'The at-fault driver’s insurance, always',
      'You, out of pocket, unless you have rental reimbursement coverage',
      'It’s included in every policy by default',
    ],
    correctIndex: 2,
    explanation:
      'Rental reimbursement isn’t automatic — it’s an optional add-on. Without it, you’re generally responsible for a rental car’s cost during repairs, even after a covered claim.',
    topic: 'Rental reimbursement on your auto policy',
  },
  {
    id: 7,
    category: 'Flood Coverage',
    question: 'Does a standard homeowners policy typically cover damage from flooding?',
    options: [
      'Yes, always',
      'No — flood damage is typically excluded and requires separate coverage',
      'Only in designated flood zones',
      'Only if the flood is caused by a burst pipe',
    ],
    correctIndex: 1,
    explanation:
      'Standard homeowners policies generally exclude flood damage from external flooding, regardless of location. Flood coverage usually requires a separate policy — something worth discussing even outside a mapped flood zone.',
    topic: 'Flood coverage, since it’s excluded from a standard homeowners policy',
  },
  {
    id: 8,
    category: 'Deductibles',
    question: 'If you choose a higher deductible, what’s the typical trade-off?',
    options: [
      'Higher premium, lower out-of-pocket cost at claim time',
      'Lower premium, but more out-of-pocket cost if you file a claim',
      'No effect on premium either way',
      'Your coverage limits automatically increase',
    ],
    correctIndex: 1,
    explanation:
      'A higher deductible usually lowers your premium but means you’d pay more out of pocket if you file a claim. The right balance depends on your savings and risk tolerance — not a one-size-fits-all answer.',
    topic: 'How your deductible level affects your out-of-pocket costs',
  },
  {
    id: 9,
    category: 'Small Business / Certificates of Insurance',
    question:
      'A landlord asks a small business tenant for a Certificate of Insurance (COI) with "additional insured" language. What is the landlord asking for?',
    options: [
      'Proof that the tenant has paid this month’s rent',
      'Proof of coverage, with the landlord added as a protected party under the tenant’s policy',
      'A discount on the tenant’s premium',
      'A copy of the tenant’s tax return',
    ],
    correctIndex: 1,
    explanation:
      'A COI proves coverage is in place, and "additional insured" status extends certain protections to the landlord (or another party) under the tenant’s policy — a common lease or contract requirement that’s easy to overlook.',
    topic: 'Certificates of Insurance and additional insured requirements',
  },
  {
    id: 10,
    category: 'Annual Review Habit',
    question:
      'How often do most insurance professionals recommend reviewing your coverage, even if nothing seems to have changed?',
    options: [
      'Only when you file a claim',
      'Every 3–5 years',
      'Annually, or after any major life or business change',
      'Never — policies auto-adjust for you',
    ],
    correctIndex: 2,
    explanation:
      'Life changes — a move, a new driver, a renovation, a new business venture — can outpace a policy that was set up years earlier. An annual check-in helps catch gaps before they matter.',
    topic: 'Making an annual coverage review a habit',
  },
]

export const challengeResultsCopy = {
  headline: 'Your Coverage Compass Score',
  framing:
    'This score reflects your familiarity with common coverage concepts — not an assessment of your actual policy. It’s a starting point, not a report card.',
  topicsIntro:
    'Based on your answers, here are a few topics that might be worth a conversation with an insurance professional:',
  noMissedTopics:
    'You answered every question correctly. An annual check-in with a licensed insurance professional is still a good habit as your situation changes.',
  primaryCta: 'Request a Free Coverage Review',
  secondaryCta: 'Explore the Learning Center',
  emailHeadline: 'Want a copy of your results and a few tailored tips?',
  emailButton: 'Send My Results',
}

export const challengeDisclaimer =
  'The Coverage Compass Challenge is an educational quiz. Your score reflects general insurance knowledge, not an evaluation of your specific policy or coverage adequacy. Only a licensed insurance professional can assess whether your actual coverage fits your needs.'
