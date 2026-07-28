// Lightweight, client-side, keyword-based policy analysis for the prototype.
// This is NOT real AI document understanding, it's a rules-based stand-in so
// the upload -> review -> score -> gap report flow responds to whatever text
// is actually found in the uploaded file. Replace this module with real
// extraction/LLM analysis when moving past the prototype stage.
//
// Now detects the LINE OF BUSINESS from the document text (auto, homeowners,
// general liability, workers' compensation, or trucking) and applies the
// matching coverage/gap rule set, instead of always assuming personal auto.

// ---------- Negation-aware keyword matching ----------

// A bare regex.test() treats "does not include rental reimbursement" the
// same as "includes rental reimbursement" - it only checks the words are
// present, not whether the sentence is negating them. That's a real
// accuracy problem for a tool whose whole premise is telling someone what
// their policy does and doesn't cover. Negation shows up on either side of
// the keyword in natural phrasing ("does not include X" vs "X is not
// included" / "X is excluded"), so check a short window on both sides of
// each match before counting it as "found."
const NEGATION_PATTERN = /\b(not|no|without|excludes?|excluding|excluded|except)\b/i
// Generous on purpose: each window is already clipped to the current
// sentence below, so this only needs to be wide enough to span a full
// sentence, not tight enough to avoid bleeding into the next one.
const NEGATION_WINDOW = 80

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
      const sentenceStart = Math.max(before.lastIndexOf('.'), before.lastIndexOf('\n'))
      if (sentenceStart !== -1) before = before.slice(sentenceStart + 1)

      const matchEnd = match.index + match[0].length
      let after = text.slice(matchEnd, matchEnd + NEGATION_WINDOW)
      const sentenceEnd = after.search(/[.\n]/)
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

// ---------- Coverage rule sets, per line of business ----------

export const coverageRuleSets = {
  auto: [
    { name: 'Bodily Injury Liability', keywords: [/bodily injury/i], explanation: "Helps protect you if you're legally responsible for injuries to others.", limitPattern: /bodily injury[^$]{0,40}(\$[\d,]+(?:\s*\/\s*\$[\d,]+)?)/i },
    { name: 'Property Damage Liability', keywords: [/property damage/i], explanation: "Helps cover damage you cause to someone else's property.", limitPattern: /property damage[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Comprehensive', keywords: [/comprehensive/i], explanation: 'Covers non-collision damage like theft, weather, or vandalism.', limitPattern: /comprehensive[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Collision', keywords: [/collision/i], explanation: 'Covers damage to your vehicle from a collision, regardless of fault.', limitPattern: /collision[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Rental Reimbursement', keywords: [/rental reimbursement/i, /rental car coverage/i], explanation: 'Pays for a rental car while your vehicle is being repaired after a covered claim.', limitPattern: /rental[^$]{0,40}(\$[\d,]+)/i },
  ],
  homeowners: [
    { name: 'Dwelling Coverage', keywords: [/dwelling coverage/i, /coverage a/i], explanation: 'Covers the physical structure of your home against covered perils.', limitPattern: /dwelling[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Other Structures', keywords: [/other structures/i, /coverage b/i], explanation: 'Covers detached structures like fences, sheds, or a detached garage.', limitPattern: /other structures[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Personal Property', keywords: [/personal property/i, /coverage c/i], explanation: 'Covers your belongings inside the home against covered perils.', limitPattern: /personal property[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Loss of Use', keywords: [/loss of use/i, /additional living expenses/i], explanation: 'Helps cover temporary living costs if your home becomes uninhabitable after a covered loss.', limitPattern: /loss of use[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Liability Coverage', keywords: [/personal liability/i, /coverage e/i], explanation: "Helps protect you if you're found legally responsible for injury or damage to others.", limitPattern: /liability[^$]{0,40}(\$[\d,]+)/i },
  ],
  general_liability: [
    { name: 'Premises / Operations Liability', keywords: [/premises/i, /operations liability/i], explanation: 'Covers third-party bodily injury or property damage arising from your business location or operations.', limitPattern: /premises[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Products / Completed Operations', keywords: [/products liability/i, /completed operations/i], explanation: 'Covers claims arising from products you sold or work you completed after the job is done.', limitPattern: /completed operations[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Personal & Advertising Injury', keywords: [/advertising injury/i, /personal injury liability/i], explanation: 'Covers claims like libel, slander, or copyright infringement in advertising.', limitPattern: /advertising injury[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Additional Insured Endorsement', keywords: [/additional insured/i], explanation: 'Extends some of your coverage to another party, often required by landlords or contracts.', limitPattern: /additional insured[^$]{0,40}(\$[\d,]+)/i },
    { name: 'General Aggregate Limit', keywords: [/general aggregate/i], explanation: 'The maximum your policy will pay in total for covered claims during the policy period.', limitPattern: /general aggregate[^$]{0,40}(\$[\d,]+)/i },
  ],
  workers_comp: [
    { name: "Workers' Compensation (Coverage A)", keywords: [/coverage a/i, /statutory limits/i, /workers'?\s*compensation/i], explanation: 'Pays statutory medical and wage-replacement benefits for employees injured on the job.', limitPattern: /workers'?\s*compensation[^$]{0,40}(\$[\d,]+)/i },
    { name: "Employer's Liability (Coverage B)", keywords: [/employer'?s liability/i, /coverage b/i], explanation: 'Covers claims from employees or their families that fall outside statutory workers\u2019 comp benefits.', limitPattern: /employer'?s liability[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Experience Modifier', keywords: [/experience mod(ifier)?\b/i], explanation: 'A factor based on claims history relative to industry peers, which affects premium.', limitPattern: /experience mod(?:ifier)?[^\d]{0,20}([\d.]+)/i },
    { name: 'Class Codes', keywords: [/class code/i], explanation: 'Codes describing the type of work performed, used to calculate premium and confirm proper classification.', limitPattern: /class code[^\d]{0,20}(\d{3,4})/i },
    { name: 'Payroll Exposure', keywords: [/payroll exposure/i, /estimated annual payroll/i], explanation: 'The payroll basis used to calculate your premium, worth confirming it matches your actual payroll.', limitPattern: /payroll[^$]{0,40}(\$[\d,]+)/i },
  ],
  trucking: [
    { name: 'Motor Carrier Liability', keywords: [/motor carrier liability/i, /combined single limit/i], explanation: 'Covers bodily injury and property damage liability while operating under your motor carrier authority.', limitPattern: /(?:motor carrier liability|combined single limit)[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Cargo Coverage', keywords: [/cargo (coverage|insurance)/i], explanation: 'Covers the freight you\u2019re hauling against covered perils like theft, collision, or fire.', limitPattern: /cargo[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Physical Damage', keywords: [/physical damage/i], explanation: 'Covers damage to your truck or trailer from a covered event.', limitPattern: /physical damage[^$]{0,40}(\$[\d,]+)/i },
    { name: 'Non-Trucking Liability (Bobtail)', keywords: [/non-?trucking liability/i, /bobtail/i], explanation: 'Covers liability while operating the tractor without a trailer or dispatched load, outside of trucking use.', limitPattern: /(?:non-?trucking liability|bobtail)[^$]{0,40}(\$[\d,]+)/i },
    { name: 'MC Authority / USDOT Status', keywords: [/\bmc\s*(number|authority)\b/i, /usdot/i], explanation: 'Confirms your motor carrier authority and USDOT number are current and matched to your operating radius.', limitPattern: /(?:mc\s*(?:number|authority)|usdot)[^\d]{0,20}(\d{5,9})/i },
  ],
}

// ---------- Gap rule sets, per line of business ----------

export const gapRuleSets = {
  auto: [
    { name: 'Umbrella Insurance', icon: 'umbrella', keywords: [/umbrella/i], what: 'Extra liability protection above your auto policy limits.', why: 'If a claim exceeds your underlying limits, an umbrella policy can help cover the difference.' },
    { name: 'Gap Insurance (Loan/Lease Payoff)', icon: 'car', keywords: [/gap insurance/i, /loan\/?lease payoff/i], what: 'Covers the difference between what you owe on a loan or lease and your vehicle’s actual cash value after a total loss.', why: 'A new vehicle can depreciate faster than a loan balance drops, leaving you owing money on a car you no longer have.' },
    { name: 'Roadside Assistance', icon: 'tool', keywords: [/roadside/i], what: 'Coverage for towing, jump-starts, lockouts, and flat tires.', why: 'A low-cost add-on some drivers assume is automatically included.' },
    { name: 'Uninsured/Underinsured Motorist', icon: 'shield', keywords: [/uninsured motorist/i, /underinsured motorist/i], what: 'Protects you if the at-fault driver has little or no insurance.', why: 'Roughly 1 in 8 drivers nationally carry no insurance at all, worth confirming this is included.' },
  ],
  homeowners: [
    { name: 'Umbrella Insurance', icon: 'umbrella', keywords: [/umbrella/i], what: 'Extra liability protection above your homeowners policy limits.', why: 'If a claim or lawsuit exceeds your underlying liability limit, an umbrella policy can help cover the difference.' },
    { name: 'Flood Coverage', icon: 'droplet', keywords: [/flood/i], what: 'Coverage for water damage from external flooding, typically excluded from standard homeowners policies.', why: "Standard home policies generally don't cover flood damage, even outside a designated flood zone." },
    { name: 'Scheduled Personal Property', icon: 'shield', keywords: [/scheduled personal property/i, /jewelry rider/i], what: 'Extra coverage for high-value items like jewelry, art, or collectibles above standard limits.', why: 'Standard policies often cap categories like jewelry far below replacement value.' },
    { name: 'Equipment Breakdown', icon: 'tool', keywords: [/equipment breakdown/i, /mechanical breakdown/i], what: 'Coverage for mechanical or electrical breakdown of home systems and appliances.', why: 'Standard property policies typically exclude mechanical breakdown, which this coverage can fill.' },
  ],
  general_liability: [
    { name: 'Umbrella / Excess Liability', icon: 'umbrella', keywords: [/umbrella/i, /excess liability/i], what: 'Extra liability protection above your CGL policy limits.', why: 'A significant claim or lawsuit can exceed standard GL limits quickly.' },
    { name: "Employment Practices Liability (EPLI)", icon: 'shield', keywords: [/employment practices liability/i, /\bEPLI\b/i], what: 'Covers claims like wrongful termination, discrimination, or harassment.', why: 'Standard GL policies typically exclude employment-related claims entirely.' },
    { name: 'Cyber Liability Insurance', icon: 'shield', keywords: [/cyber liability/i, /cyber\s*(security)?\s*insurance/i, /data breach/i, /ransomware/i], what: 'Covers costs from data breaches, ransomware, or other cyber incidents.', why: 'Most GL policies exclude cyber-related losses, this typically requires a separate policy.' },
    { name: 'Hired & Non-Owned Auto Liability (HNOA)', icon: 'car', keywords: [/hired.{0,3}(and|&)?.{0,3}non-?owned auto/i, /\bHNOA\b/i], what: 'Covers liability when an employee drives a rented or personal vehicle for business purposes.', why: 'A standard GL policy typically excludes auto exposure entirely, this is a common gap for businesses that assume company errands are covered.' },
  ],
  workers_comp: [
    { name: 'Voluntary Compensation Coverage', icon: 'shield', keywords: [/voluntary compensation/i], what: 'Extends benefits to employees who might not be automatically covered under statutory workers\u2019 comp, such as out-of-state or occasional workers.', why: 'Without it, certain employees could fall entirely outside your statutory coverage after an injury.' },
    { name: 'Additional Named Insureds (Subsidiaries/DBAs)', icon: 'tool', keywords: [/additional named insured/i, /subsidiar(y|ies)/i, /\bDBA\b/i], what: 'Whether related entities, subsidiaries, or DBAs are properly added to the policy as named insureds.', why: 'A claim involving an entity not listed on the policy may not be covered at all.' },
    { name: 'Owner/Officer Exclusion Status', icon: 'shield', keywords: [/officer exclusion/i, /owner exclusion/i, /sole proprietor/i], what: 'Whether owners or officers are included in or excluded from coverage.', why: 'State rules vary, and an incorrect exclusion election can leave an owner personally uninsured.' },
    { name: 'Waiver of Subrogation', icon: 'tool', keywords: [/waiver of subrogation/i], what: 'A provision waiving the insurer\u2019s right to recover costs from a third party, often required by contracts.', why: 'General contractors frequently require this before allowing work to begin.' },
  ],
  trucking: [
    { name: 'Reefer/Cargo Refrigeration Breakdown', icon: 'droplet', keywords: [/reefer breakdown/i, /refrigeration breakdown/i, /\breefer\b/i], what: 'Covers spoiled or damaged cargo caused by a mechanical breakdown of refrigeration equipment.', why: 'Standard cargo coverage often excludes spoilage from equipment breakdown, a common gap for refrigerated freight.' },
    { name: 'Trailer Interchange Coverage', icon: 'car', keywords: [/trailer interchange/i], what: 'Covers a non-owned trailer you\u2019re pulling under an interchange agreement.', why: 'Your own physical damage coverage typically only applies to trailers you own, leaving interchanged trailers unprotected.' },
    { name: 'General Liability (Off-Truck)', icon: 'shield', keywords: [/general liability/i, /premises liability/i], what: 'Liability coverage for incidents at a drop yard, warehouse, or loading dock, separate from operating the vehicle.', why: 'Motor carrier liability only applies while the vehicle is in use, not for other business-related incidents.' },
    { name: 'BOC-3 / Process Agent Filing', icon: 'shield', keywords: [/boc-?3/i, /process agent/i], what: 'A required filing designating agents to receive legal documents in each state you operate.', why: 'Missing or lapsed BOC-3 filings can suspend your operating authority.' },
  ],
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

  const coverageScore = Math.round(
    40 +
      (foundCoverageCount / coverageRules.length) * 35 +
      (foundGapProtections / gapRules.length) * 25,
  )

  // Property Protection and Deductibles are meaningful checks for lines of
  // business that actually have a property component or a typical per-claim
  // deductible (auto, homeowners, trucking). General liability and workers'
  // comp are purely liability/statutory-benefit lines with neither, so
  // scoring them here would always read "Worth a look" on a perfectly
  // complete policy, a false flag rather than a real gap.
  const hasPropertyComponent = detected.type !== 'general_liability' && detected.type !== 'workers_comp'
  const hasTypicalDeductible = detected.type !== 'general_liability' && detected.type !== 'workers_comp'

  const scoreCategories = [
    {
      name: 'Liability Protection',
      status: coverages.some(
        (c) => /liability/i.test(c.name) && c.confidence !== 'missing',
      )
        ? 'good'
        : 'review',
    },
    ...(hasPropertyComponent
      ? [
          {
            name: 'Property Protection',
            status: coverages.some(
              (c) => /(comprehensive|dwelling|physical damage|property)/i.test(c.name) && c.confidence !== 'missing',
            )
              ? 'good'
              : 'review',
          },
        ]
      : []),
    ...(hasTypicalDeductible
      ? [{ name: 'Deductibles', status: /deductible/i.test(text) ? 'good' : 'review' }]
      : []),
    {
      name: 'Optional Coverages',
      status: foundGapProtections >= gapRules.length / 2 ? 'good' : 'review',
    },
    {
      name: 'Risk Areas',
      status: foundCoverageCount === coverageRules.length ? 'good' : 'review',
    },
  ]

  return {
    fileName: meta.fileName || 'uploaded document',
    analyzedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    hasRealText: text.trim().length > 40,
    namedInsured: extractNamedInsured(text),
    detectedPolicyType: detected.label,
    coverageScore: Math.max(20, Math.min(98, coverageScore)),
    coverages,
    gaps,
    scoreCategories,
    questionsToAsk: buildQuestions(gaps),
    strengths: buildStrengths(coverages),
  }
}

function buildQuestions(gaps) {
  const notFound = gaps.filter((g) => !g.found).slice(0, 4)
  const base = notFound.map((g) => `Would ${g.name.toLowerCase()} make sense for my situation?`)
  return [
    'Do I have enough liability protection given my exposure?',
    ...base,
    'Are there any exclusions in my policy I should know about?',
  ].slice(0, 5)
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
    const label = c.name.toLowerCase()
    const suffix = /coverage/i.test(label) || NOT_COVERAGE.test(label) ? '' : ' coverage'
    return `Your policy includes ${label}${suffix}${c.limit.startsWith('$') ? ` (${c.limit})` : ''}.`
  })
}
