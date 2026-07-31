// Shared insurance domain knowledge and scoring logic, used by BOTH:
//   1. The client-side fallback engine (policyAnalysis.js's keyword matcher)
//   2. The server-side LLM analysis worker (worker/src/*)
//
// Splitting this out (rather than duplicating it in the worker) means the
// two engines agree on what "Bodily Injury Liability" means, what counts as
// a gap worth asking about, and — critically — compute the exact same
// coverageScore from the same inputs. A person switching between "the
// backend was down so you got the fallback engine" and "the real LLM
// analyzed your document" should never see the score jump around because
// the two engines were quietly using different rules.
//
// Pure JS, no DOM/Node/browser APIs — safe to import from a Cloudflare
// Worker's V8 isolate as well as from the Vite app.

export const POLICY_TYPES = [
  { type: 'trucking', label: 'Trucking / Motor Carrier' },
  { type: 'workers_comp', label: "Workers' Compensation" },
  { type: 'general_liability', label: 'Commercial General Liability' },
  { type: 'renters', label: 'Renters' },
  { type: 'homeowners', label: 'Homeowners' },
  { type: 'auto', label: 'Personal / Commercial Auto' },
]

export function labelForType(type) {
  return POLICY_TYPES.find((p) => p.type === type)?.label || POLICY_TYPES[POLICY_TYPES.length - 1].label
}

export const coverageRuleSets = {
  auto: [
    { name: 'Bodily Injury Liability', keywords: [/bodily injury/i], explanation: "Helps protect you if you're legally responsible for injuries to others.", limitPattern: /bodily injury[^$]{0,40}(\$[\d,]*\d(?:\s*\/\s*\$[\d,]*\d)?)/i },
    { name: 'Property Damage Liability', keywords: [/property damage/i], explanation: "Helps cover damage you cause to someone else's property.", limitPattern: /property damage[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Comprehensive', keywords: [/comprehensive/i], explanation: 'Covers non-collision damage like theft, weather, or vandalism.', limitPattern: /comprehensive[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Collision', keywords: [/collision/i], explanation: 'Covers damage to your vehicle from a collision, regardless of fault.', limitPattern: /collision[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Rental Reimbursement', keywords: [/rental reimbursement/i, /rental car coverage/i], explanation: 'Pays for a rental car while your vehicle is being repaired after a covered claim.', limitPattern: /rental[^$]{0,40}(\$[\d,]*\d)/i },
  ],
  homeowners: [
    { name: 'Dwelling Coverage', keywords: [/dwelling coverage/i, /coverage a/i], explanation: 'Covers the physical structure of your home against covered perils.', limitPattern: /dwelling[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Other Structures', keywords: [/other structures/i, /coverage b/i], explanation: 'Covers detached structures like fences, sheds, or a detached garage.', limitPattern: /other structures[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Personal Property', keywords: [/personal property/i, /coverage c/i], explanation: 'Covers your belongings inside the home against covered perils.', limitPattern: /personal property[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Loss of Use', keywords: [/loss of use/i, /additional living expenses/i], explanation: 'Helps cover temporary living costs if your home becomes uninhabitable after a covered loss.', limitPattern: /loss of use[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Liability Coverage', keywords: [/personal liability/i, /coverage e/i], explanation: "Helps protect you if you're found legally responsible for injury or damage to others.", limitPattern: /liability[^$]{0,40}(\$[\d,]*\d)/i },
  ],
  renters: [
    { name: 'Personal Property', keywords: [/personal property/i, /coverage c/i], explanation: 'Covers your belongings against covered perils like theft, fire, or water damage.', limitPattern: /personal property[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Loss of Use', keywords: [/loss of use/i, /additional living expenses/i, /coverage d/i], explanation: 'Helps cover temporary living costs if your rental becomes uninhabitable after a covered loss.', limitPattern: /loss of use[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Personal Liability', keywords: [/personal liability/i, /coverage e/i], explanation: "Helps protect you if you're found legally responsible for injury or damage to others.", limitPattern: /personal liability[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Medical Payments to Others', keywords: [/medical payments to others/i, /coverage f/i], explanation: 'Covers no-fault medical costs if a guest is injured in your rental, regardless of who is at fault.', limitPattern: /medical payments to others[^$]{0,40}(\$[\d,]*\d)/i },
  ],
  general_liability: [
    { name: 'Premises / Operations Liability', keywords: [/premises/i, /operations liability/i], explanation: 'Covers third-party bodily injury or property damage arising from your business location or operations.', limitPattern: /premises[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Products / Completed Operations', keywords: [/products liability/i, /completed operations/i], explanation: 'Covers claims arising from products you sold or work you completed after the job is done.', limitPattern: /completed operations[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Personal & Advertising Injury', keywords: [/advertising injury/i, /personal injury liability/i], explanation: 'Covers claims like libel, slander, or copyright infringement in advertising.', limitPattern: /advertising injury[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Additional Insured Endorsement', keywords: [/additional insured/i], explanation: 'Extends some of your coverage to another party, often required by landlords or contracts.', limitPattern: /additional insured[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'General Aggregate Limit', keywords: [/general aggregate/i], explanation: 'The maximum your policy will pay in total for covered claims during the policy period.', limitPattern: /general aggregate[^$]{0,40}(\$[\d,]*\d)/i },
  ],
  workers_comp: [
    { name: "Workers' Compensation (Coverage A)", keywords: [/coverage a/i, /statutory limits/i, /workers'?\s*compensation/i], explanation: 'Pays statutory medical and wage-replacement benefits for employees injured on the job.', limitPattern: /workers'?\s*compensation[^$]{0,40}(\$[\d,]*\d)/i },
    { name: "Employer's Liability (Coverage B)", keywords: [/employer'?s liability/i, /coverage b/i], explanation: 'Covers claims from employees or their families that fall outside statutory workers’ comp benefits.', limitPattern: /employer'?s liability[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Experience Modifier', keywords: [/experience mod(ifier)?\b/i], explanation: 'A factor based on claims history relative to industry peers, which affects premium.', limitPattern: /experience mod(?:ifier)?[^\d]{0,20}([\d.]+)/i },
    { name: 'Class Codes', keywords: [/class code/i], explanation: 'Codes describing the type of work performed, used to calculate premium and confirm proper classification.', limitPattern: /class code[^\d]{0,20}(\d{3,4})/i },
    { name: 'Payroll Exposure', keywords: [/payroll exposure/i, /estimated annual payroll/i], explanation: 'The payroll basis used to calculate your premium, worth confirming it matches your actual payroll.', limitPattern: /payroll[^$]{0,40}(\$[\d,]*\d)/i },
  ],
  trucking: [
    { name: 'Motor Carrier Liability', keywords: [/motor carrier liability/i, /combined single limit/i], explanation: 'Covers bodily injury and property damage liability while operating under your motor carrier authority.', limitPattern: /(?:motor carrier liability|combined single limit)[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Cargo Coverage', keywords: [/cargo (coverage|insurance)/i], explanation: 'Covers the freight you’re hauling against covered perils like theft, collision, or fire.', limitPattern: /cargo[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Physical Damage', keywords: [/physical damage/i], explanation: 'Covers damage to your truck or trailer from a covered event.', limitPattern: /physical damage[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'Non-Trucking Liability (Bobtail)', keywords: [/non-?trucking liability/i, /bobtail/i], explanation: 'Covers liability while operating the tractor without a trailer or dispatched load, outside of trucking use.', limitPattern: /(?:non-?trucking liability|bobtail)[^$]{0,40}(\$[\d,]*\d)/i },
    { name: 'MC Authority / USDOT Status', keywords: [/\bmc\s*(number|authority)\b/i, /usdot/i], explanation: 'Confirms your motor carrier authority and USDOT number are current and matched to your operating radius.', limitPattern: /(?:mc\s*(?:number|authority)|usdot)[^\d]{0,20}(\d{5,9})/i },
  ],
}

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
  renters: [
    { name: 'Replacement Cost Coverage', icon: 'shield', keywords: [/replacement cost/i], what: 'Pays to replace belongings at today’s prices, instead of depreciated actual cash value.', why: 'Many renters policies default to actual cash value, which can pay far less than a replacement actually costs.' },
    { name: 'Scheduled Personal Property', icon: 'shield', keywords: [/scheduled personal property/i, /jewelry rider/i], what: 'Extra coverage for high-value items like jewelry, art, or electronics above standard limits.', why: 'Standard renters policies often cap categories like jewelry or electronics far below replacement value.' },
    { name: 'Identity Theft Coverage', icon: 'tool', keywords: [/identity theft/i, /identity fraud/i], what: 'Covers expenses to resolve identity theft, like lost wages or legal fees.', why: 'Not automatically included on most renters policies, usually a low-cost add-on.' },
    { name: 'Water Backup Coverage', icon: 'droplet', keywords: [/water backup/i, /sewer backup/i, /sump pump/i], what: 'Covers damage from water backing up through drains or sewers, a common exclusion.', why: 'Standard policies typically exclude backup or overflow from drains or sump pumps without this endorsement.' },
  ],
  general_liability: [
    { name: 'Umbrella / Excess Liability', icon: 'umbrella', keywords: [/umbrella/i, /excess liability/i], what: 'Extra liability protection above your CGL policy limits.', why: 'A significant claim or lawsuit can exceed standard GL limits quickly.' },
    { name: "Employment Practices Liability (EPLI)", icon: 'shield', keywords: [/employment practices liability/i, /\bEPLI\b/i], what: 'Covers claims like wrongful termination, discrimination, or harassment.', why: 'Standard GL policies typically exclude employment-related claims entirely.' },
    { name: 'Cyber Liability Insurance', icon: 'shield', keywords: [/cyber liability/i, /cyber\s*(security)?\s*insurance/i, /data breach/i, /ransomware/i], what: 'Covers costs from data breaches, ransomware, or other cyber incidents.', why: 'Most GL policies exclude cyber-related losses, this typically requires a separate policy.' },
    { name: 'Hired & Non-Owned Auto Liability (HNOA)', icon: 'car', keywords: [/hired.{0,3}(and|&)?.{0,3}non-?owned auto/i, /\bHNOA\b/i], what: 'Covers liability when an employee drives a rented or personal vehicle for business purposes.', why: 'A standard GL policy typically excludes auto exposure entirely, this is a common gap for businesses that assume company errands are covered.' },
  ],
  workers_comp: [
    { name: 'Voluntary Compensation Coverage', icon: 'shield', keywords: [/voluntary compensation/i], what: 'Extends benefits to employees who might not be automatically covered under statutory workers’ comp, such as out-of-state or occasional workers.', why: 'Without it, certain employees could fall entirely outside your statutory coverage after an injury.' },
    { name: 'Additional Named Insureds (Subsidiaries/DBAs)', icon: 'tool', keywords: [/additional named insured/i, /subsidiar(y|ies)/i, /\bDBA\b/i], what: 'Whether related entities, subsidiaries, or DBAs are properly added to the policy as named insureds.', why: 'A claim involving an entity not listed on the policy may not be covered at all.' },
    { name: 'Owner/Officer Exclusion Status', icon: 'shield', keywords: [/officer exclusion/i, /owner exclusion/i, /sole proprietor/i], what: 'Whether owners or officers are included in or excluded from coverage.', why: 'State rules vary, and an incorrect exclusion election can leave an owner personally uninsured.' },
    { name: 'Waiver of Subrogation', icon: 'tool', keywords: [/waiver of subrogation/i], what: 'A provision waiving the insurer’s right to recover costs from a third party, often required by contracts.', why: 'General contractors frequently require this before allowing work to begin.' },
  ],
  trucking: [
    { name: 'Reefer/Cargo Refrigeration Breakdown', icon: 'droplet', keywords: [/reefer breakdown/i, /refrigeration breakdown/i, /\breefer\b/i], what: 'Covers spoiled or damaged cargo caused by a mechanical breakdown of refrigeration equipment.', why: 'Standard cargo coverage often excludes spoilage from equipment breakdown, a common gap for refrigerated freight.' },
    { name: 'Trailer Interchange Coverage', icon: 'car', keywords: [/trailer interchange/i], what: 'Covers a non-owned trailer you’re pulling under an interchange agreement.', why: 'Your own physical damage coverage typically only applies to trailers you own, leaving interchanged trailers unprotected.' },
    { name: 'General Liability (Off-Truck)', icon: 'shield', keywords: [/general liability/i, /premises liability/i], what: 'Liability coverage for incidents at a drop yard, warehouse, or loading dock, separate from operating the vehicle.', why: 'Motor carrier liability only applies while the vehicle is in use, not for other business-related incidents.' },
    { name: 'BOC-3 / Process Agent Filing', icon: 'shield', keywords: [/boc-?3/i, /process agent/i], what: 'A required filing designating agents to receive legal documents in each state you operate.', why: 'Missing or lapsed BOC-3 filings can suspend your operating authority.' },
  ],
}

// Property Protection and Deductibles are meaningful checks for lines of
// business that actually have a property component or a typical per-claim
// deductible (auto, homeowners, trucking). General liability and workers'
// comp are purely liability/statutory-benefit lines with neither, so
// scoring them here would always read "Worth a look" on a perfectly
// complete policy, a false flag rather than a real gap.
function hasPropertyOrDeductibleComponent(type) {
  return type !== 'general_liability' && type !== 'workers_comp'
}

// Same formula and category logic for both engines, so the coverageScore
// means the same thing regardless of whether it came from the client-side
// keyword fallback or the server-side LLM analysis - a person shouldn't see
// the number jump around depending on which engine happened to answer.
export function computeScoreCategories({ type, coverages, gaps, deductibleStated }) {
  const foundGapProtections = gaps.filter((g) => g.found).length
  const hasComponent = hasPropertyOrDeductibleComponent(type)

  return [
    {
      name: 'Liability Protection',
      status: coverages.some((c) => /liability/i.test(c.name) && c.confidence !== 'missing') ? 'good' : 'review',
    },
    ...(hasComponent
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
    ...(hasComponent ? [{ name: 'Deductibles', status: deductibleStated ? 'good' : 'review' }] : []),
    {
      name: 'Optional Coverages',
      status: foundGapProtections >= gaps.length / 2 ? 'good' : 'review',
    },
    {
      name: 'Risk Areas',
      status: coverages.every((c) => c.confidence !== 'missing') ? 'good' : 'review',
    },
  ]
}

export function computeCoverageScore({ foundCoverageCount, totalCoverageRules, foundGapProtections, totalGapRules }) {
  const score = Math.round(40 + (foundCoverageCount / totalCoverageRules) * 35 + (foundGapProtections / totalGapRules) * 25)
  return Math.max(20, Math.min(98, score))
}
