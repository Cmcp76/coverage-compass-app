# Coverage Compass — Prototype (v1)

A responsive React + Tailwind prototype of Coverage Compass, an independent,
education-first insurance platform. Built from the approved copy deck and
build brief. **Uses mock/sample data only** — no real customer policies, no
live carrier integrations, no payments, no binding/cancelling of coverage.

## Run it locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview
```

To run the test suite:

```bash
npm test
```

Live preview (auto-deployed from this branch via GitHub Actions):
https://cmcp76.github.io/coverage-compass-app/

## What's included

- **Landing page** — hero, three-step explainer, "Why Coverage Compass,"
  testimonials (placeholder — swap before launch), featured articles, FAQ
- **Account flow** — Sign Up, Login, Password Reset, Email Verification,
  Welcome
- **Dashboard** — Coverage Score card, coverage checklist, recent activity,
  educational recommendations
- **Upload Policy** — drag-and-drop UI with simulated upload → scanning →
  confirmation states (no real file processing/OCR yet)
- **AI Policy Review** — mocked extraction output with confidence indicators
  and a `NEEDED INFORMATION` label for missing fields
- **Coverage Score** — large score display, expandable category breakdown
- **Coverage Gap Report** — gap cards with neutral/"worth confirming"
  status tags (not red/alert styling), generated questions, and a mocked
  "Request a Callback" lead-gen form (clearly labeled as a prototype, no
  request is actually sent anywhere)
- **Professional Report** — cover → score → summary → strengths → gaps →
  questions → next steps → disclaimer structure, both printable
  (`window.print()`) and downloadable as a real PDF (`jspdf`)
- **Reports** — history of every policy you've reviewed this session
  (persisted to `localStorage`, last 10), with a score-over-time chart once
  you have 2+
- **Notifications** — a feed that reflects your actual latest analysis, not
  just static copy
- **Insurance Learning Center** — searchable/filterable articles + glossary
  preview
- **Interactive Tools** — all six tools are functional: Deductible Calculator,
  Risk Assessment Quiz, Home Inventory Checklist (with CSV export and
  localStorage persistence), Coverage Comparison Tool, Annual Insurance
  Checkup, and a full searchable Glossary
- **Coverage Compass Challenge** (`/challenge`) — a standalone 10-question
  quiz entry point, no policy upload required. Explanations shown after
  every answer regardless of right/wrong, an educational `X / 10` score
  (never framed as a grade or verdict), and 2–3 "worth discussing" topics
  generated from which specific questions were missed, capped and never
  padded to a generic list. Reuses the same lead-gen "Request a Callback"
  flow and neutral tag styling as the Gap Report
- **Start My Trucking Company** (`/trucking-startup`) — a step-by-step
  checklist for setting up a motor carrier: business formation, FMCSA
  authority, state/interstate registrations, driver and vehicle compliance,
  and an interactive "what insurance do I need" guide keyed off operation
  type (general freight, hazmat, household goods, refrigerated, leased
  owner-operator). Checklist progress persists to `localStorage`. Linked
  from the Dashboard and Tools page since it's meant to be reachable by
  someone who just wants the checklist, with no policy upload required
- **Dark mode** — toggle in the header, persisted to `localStorage`, defaults
  to system preference on first visit. Colors are driven by CSS custom
  properties (`src/index.css`) rather than `dark:` classes scattered through
  components, and every color pair is WCAG AA contrast-checked. The
  printable Report always renders light regardless of the on-screen theme.
  A `theme-color` meta tag keeps the mobile browser chrome in sync too.
- **About / Privacy Policy / Terms of Service** — real static pages, not
  placeholder links
- **Internationalization** — every route lives under a `/:lang` URL segment
  (`/en/...`, `/es/...`), with a language switcher in the header. English is
  the default and Spanish is fully live for navigation, forms, buttons, and
  the glossary; French, Arabic, and Vietnamese are wired into the i18next
  config and ready to enable once translations exist for them (`src/i18n/`).
  Page-specific body copy (article text, page-specific descriptions) is not
  yet migrated to translation files — see `src/i18n/locales/` for what's
  covered today.
- **A top-level error boundary** (`src/components/ErrorBoundary.jsx`) — a
  render error anywhere shows a friendly, on-brand fallback with a "Refresh"
  and a "Go to Dashboard" action, instead of a blank white screen, and
  specifically recognizes a stale-chunk-after-deploy failure (this app's
  routes are lazy-loaded with content-hashed filenames) to suggest a
  refresh rather than a generic error

## The analysis engine (`src/lib/policyAnalysis.js`)

This is the most "real" part of the prototype. Upload a file and it:

1. Extracts actual text from the PDF (via `pdfjs-dist`, entirely in your
   browser, nothing is sent to a server) or reads a `.txt` file directly
2. Detects which **line of business** the document is — personal/commercial
   auto, homeowners, renters, commercial general liability, workers'
   compensation, or trucking/motor carrier — based on keyword signals
3. Applies a rule set specific to that line of business to identify
   coverages present, coverages missing (`NEEDED INFORMATION`), and common
   gaps worth a second look
4. Feeds the result into the Coverage Score, Gap Report, Professional
   Report, and Dashboard — all live off the same shared analysis, not
   independent static copies

**Try it**: six sample `.txt` policies are in `sample-policies/` — one each
for auto, homeowners, renters, general liability, workers' comp, and
trucking. Upload each one and watch the coverages, gaps, and score change to
match.

**Be clear-eyed about what this is**: it's keyword matching, not real AI
document understanding. It'll miss nuance, get fooled by unfamiliar phrasing,
and shouldn't be mistaken for production-grade extraction. It's a
meaningfully more realistic prototype than a static mock, not a finished
product.

All copy is pulled verbatim from the approved copy deck — headlines, CTAs,
and disclaimers were not paraphrased.

## Testing (Vitest)

`npm test` runs 1,247 automated tests across seven files (most of that count
is generated fuzz-test cases, see below — there are roughly 90 hand-written
test cases). It also runs in this repo's GitHub Actions deploy workflow
before every deploy, so a regression can't ship to the live preview.

`src/lib/policyAnalysis.test.js` covers the analysis engine:

- Policy type detection and named insured extraction for all 6 sample
  policies, plus a renters-vs-homeowners tie-breaking regression
- Negation handling ("does not include X" / "X is not included" / "X is
  excluded"), including the sentence-boundary-clipping regression this
  logic went through during development (both the original newline/period
  version and a later regression where a decimal point in a dollar amount,
  e.g. "$1,500.00", was mistaken for the end of a sentence)
- A structural guard against a specific bug class found during development:
  a "gap" rule sharing an exact keyword with a "coverage" rule in the same
  rule set, which double-reports the same real-world concept
- The closing "exclusions" question always surviving in `questionsToAsk`,
  even when every gap protection is missing (an off-by-one regression)
- Full-pipeline sanity checks (score bounds, non-empty results) against
  every sample policy

`src/lib/policyAnalysis.fuzz.test.js` takes a different approach: rather than
hand-picked cases, it generates ~1,150 randomized and adversarial inputs
(seeded, so a failure is reproducible) and asserts the analysis engine never
throws, stays within its score bounds, and never leaks `undefined`/`NaN`
into user-facing text — including a dedicated pass of ReDoS-shaped input
against every `limitPattern` regex in the ruleset, checking none of them
exhibit catastrophic backtracking.

`src/context/PolicyContext.test.js` covers the localStorage persistence
layer: falling back safely when a stored value is valid JSON but the wrong
shape (a real bug — `"null"` is valid JSON), round-tripping the current
analysis/history, and the "viewing an older report" tracking used to warn
someone browsing their report history that they've swapped out their active
analysis.

`src/lib/generateReportPdf.test.js` and `src/lib/pdfText.test.js` cover the
PDF report generator's page-break/pagination math and the real-PDF-upload
text-extraction line-join logic, respectively — both areas that had real,
non-obvious bugs (a lost table header on one specific page-break trigger,
and a lost line break that silently broke negation detection on real
uploads) before gaining test coverage.

`src/lib/challengeScoring.test.js` covers the Coverage Compass Challenge's
"topics worth discussing" mapping — the one piece of real logic in that
module: missed questions map to their topic in question order, unanswered
or correctly-answered questions never do, the result is capped at 3 and
never padded, and a specific missed-question pattern is pinned against the
real quiz data to match the build brief's example bullets exactly.

`src/lib/errorClassification.test.js` covers the app's top-level error
boundary's chunk-load-failure detection (the trigger for "a new version
is available, refresh" vs. a generic error message), pinned against the
actual Chrome/Firefox/Safari dynamic-import failure message formats, with
negative cases for ordinary app errors and messages that merely contain
"import" as a substring.

## What's intentionally NOT built yet

Per the build brief's guardrails:

- Real document extraction/OCR (the "AI scanning" step is a timed mock)
- Real user accounts/database/auth — Sign Up/Login/Log Out are all real,
  working UI flows (Log Out resets the session back to demo state), but
  there's no real backend behind them; any email/password combination logs
  in
- Payments or subscriptions
- Carrier marketplace or quoting
- Mobile app (this is responsive web, not native)

## Sample data

Before you upload anything, every screen shows one consistent fictional demo
auto policy (`src/data/mockData.js`, clearly labeled as demo data) — Coverage
Score 87/100, sample carrier "Sample Insurance Co," and the gaps: no
umbrella policy referenced, no flood coverage, no gap insurance for a
loan/lease payoff, and roadside assistance mentioned but worth confirming
(the one gap in the demo data that exercises the "Worth Confirming" status,
distinct from the other three's "Not Found in Policy"). Upload a real file
(or one of the 6 samples in `sample-policies/`) and every screen switches
to reflect that document's actual analysis instead, saved to your Reports
history.

## Before this goes anywhere near real users

- [ ] Swap placeholder testimonials for real, permissioned quotes
- [ ] Replace mock AI review/scoring with actual document extraction logic
      (keep the `NEEDED INFORMATION` / "never guarantee" rules from the
      Master Project instructions)
- [ ] Add real authentication and encrypted document storage
- [ ] Privacy, security, legal, and insurance-compliance review
- [ ] Run a formal accessibility audit with real assistive-tech testing and
      automated contrast tooling. Meaningful a11y work has gone into this
      prototype already — focus management and focus trapping on the
      account/mobile menus, `aria-pressed` on toggle controls, focus moving
      to newly-shown content on the Challenge quiz, keyboard-reachable
      controls throughout — but that's not a substitute for a real audit
      before this reaches actual users.

## Notes for whoever picks this up next

- Tailwind theme (`tailwind.config.js`) defines the `compass-*` color
  palette (navy, blue, sky blue, green, mint, amber) used throughout — this
  is a first pass at the "blue, green, white" brand direction from the
  design brief and can be adjusted without touching component code.
- Every page that shows the analysis engine's output displays a visible
  disclaimer, not just a footer link, per the "non-negotiable guardrails"
  section of the build brief. Copy across the app describes this as
  pattern-matching analysis rather than "AI," matching what
  `policyAnalysis.js` actually does — see Terms of Service for the precise
  wording.
