// Sample fictional policy data used consistently across every screen.
// No real carrier names, no real customer data. Prototype only.

export const samplePolicy = {
  customerFirstName: 'Maria',
  customerFullName: 'Maria Alvarez',
  policyType: 'Auto',
  carrierName: 'Sample Insurance Co',
  effectiveDate: 'Jan 1, 2026',
  reportGeneratedDate: 'Jul 26, 2026',
  coverageScore: 87,
  coverages: [
    {
      name: 'Bodily Injury Liability',
      limit: '$250,000 / $500,000',
      explanation:
        "Helps protect you if you're legally responsible for injuries to others.",
      confidence: 'high',
    },
    {
      name: 'Property Damage Liability',
      limit: '$100,000',
      explanation: "Helps cover damage you cause to someone else's property.",
      confidence: 'high',
    },
    {
      name: 'Comprehensive',
      limit: '$500 deductible',
      explanation: 'Covers non-collision damage like theft, weather, or vandalism.',
      confidence: 'high',
    },
    {
      name: 'Collision',
      limit: '$500 deductible',
      explanation:
        'Covers damage to your vehicle from a collision, regardless of fault.',
      confidence: 'high',
    },
    {
      name: 'Rental Reimbursement',
      limit: 'NEEDED INFORMATION',
      explanation:
        'Not found in the uploaded document. Coverage details could not be confirmed.',
      confidence: 'missing',
    },
  ],
  scoreCategories: [
    { name: 'Liability Protection', status: 'good', icon: 'shield' },
    { name: 'Property Protection', status: 'good', icon: 'home' },
    { name: 'Deductibles', status: 'good', icon: 'cash' },
    { name: 'Optional Coverages', status: 'review', icon: 'umbrella' },
    { name: 'Risk Areas', status: 'review', icon: 'alert' },
  ],
  strengths: [
    'Your liability limits are at or above commonly recommended minimums for your state.',
    'Your deductibles are clearly stated and consistent across comprehensive and collision.',
    'Your policy includes uninsured/underinsured motorist coverage.',
  ],
  gaps: [
    {
      name: 'Umbrella Insurance',
      what: 'Extra liability protection that kicks in above your auto or home policy limits.',
      why: 'If a claim or lawsuit exceeds your underlying liability limits, an umbrella policy can help cover the difference.',
      status: 'Not Found in Policy',
      icon: 'umbrella',
    },
    {
      name: 'Flood Coverage',
      what: 'Coverage for water damage from external flooding, typically excluded from standard homeowners policies.',
      why: "Standard home policies generally don't cover flood damage, even if you're not in a designated flood zone.",
      status: 'Not Found in Policy',
      icon: 'droplet',
    },
    {
      name: 'Rental Car Coverage',
      what: 'Coverage that pays for a rental car while your vehicle is being repaired after a covered claim.',
      why: 'Without it, you may be responsible for rental costs out of pocket during repairs.',
      status: 'Worth Confirming',
      icon: 'car',
    },
    {
      name: 'Roadside Assistance',
      what: 'Coverage for towing, jump-starts, lockouts, and flat tires.',
      why: 'A low-cost add-on that some drivers assume is automatically included.',
      status: 'Not Found in Policy',
      icon: 'tool',
    },
  ],
  questionsToAsk: [
    'Do I have enough liability protection given my assets and risk exposure?',
    'Would an umbrella policy make sense for my situation?',
    'Is flood coverage something I should consider, even outside a flood zone?',
    'Are my deductibles set at the right level for my budget and risk tolerance?',
    'Are there any exclusions in my policy I should know about?',
  ],
}

export const recentActivity = [
  {
    type: 'review',
    title: 'Auto policy reviewed',
    date: 'Jul 22, 2026',
  },
  {
    type: 'alert',
    title: 'Umbrella coverage worth reviewing',
    date: 'Coverage alert',
  },
  {
    type: 'renewal',
    title: 'Homeowners policy renews in 34 days',
    date: 'Renewal reminder',
  },
  {
    type: 'education',
    title: '3 new articles on Homeowners Insurance',
    date: 'Keep learning',
  },
]

export const articles = [
  {
    category: 'Homeowners',
    title: 'Actual Cash Value vs. Replacement Cost: What\u2019s the Difference?',
    summary:
      'Two claim payout methods that can mean a very different check size after a loss.',
    readTime: '4 min read',
  },
  {
    category: 'Commercial',
    title: 'What Is a Certificate of Insurance, and Why Does My Landlord Want One?',
    summary:
      'A quick breakdown of COIs, additional insured language, and why they matter for leases and contracts.',
    readTime: '3 min read',
  },
  {
    category: 'Trucking',
    title: 'USDOT Number vs. MC Authority: What\u2019s the Difference?',
    summary:
      'Two identifiers every motor carrier needs, and what each one actually authorizes you to do.',
    readTime: '5 min read',
  },
  {
    category: 'Insurance Terms',
    title: 'What Does \u201cEndorsement\u201d Actually Mean?',
    summary: "It's not a celebrity ad, here's what an endorsement changes on your policy.",
    readTime: '2 min read',
  },
  {
    category: 'Auto',
    title: 'Do You Need an Umbrella Policy? Here\u2019s How to Tell.',
    summary:
      'A plain-language look at when extra liability protection is worth considering.',
    readTime: '4 min read',
  },
  {
    category: 'Renters',
    title: 'Renters Insurance 101: What It Actually Covers',
    summary: 'A quick guide to personal property, liability, and additional living expenses.',
    readTime: '3 min read',
  },
]

export const glossaryTerms = [
  {
    term: 'Declarations Page',
    definition:
      "The summary page of your policy, usually the first page, showing who's insured, what's covered, your limits, deductibles, and effective dates.",
  },
  {
    term: 'Subrogation',
    definition:
      "The process by which your insurance company seeks reimbursement from an at-fault party's insurer after paying your claim.",
  },
  {
    term: 'Endorsement',
    definition:
      'A change or addition to your policy that adjusts, adds, or removes coverage from the base policy.',
  },
]

export const categories = [
  'Auto Insurance',
  'Homeowners Insurance',
  'Renters Insurance',
  'Condo Insurance',
  'Landlord Insurance',
  'Life Insurance',
  'Commercial Insurance',
  "Workers' Compensation",
  'Trucking Insurance',
  'Insurance Terms',
]
