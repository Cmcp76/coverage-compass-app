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
- **Dark mode** — toggle in the header, persisted to `localStorage`, defaults
  to system preference on first visit. Colors are driven by CSS custom
  properties (`src/index.css`) rather than `dark:` classes scattered through
  components, and every color pair is WCAG AA contrast-checked. The
  printable Report always renders light regardless of the on-screen theme.

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

## Testing (`src/lib/policyAnalysis.test.js`, Vitest)

`npm test` runs 38 automated tests against the analysis engine. It also runs
in this repo's GitHub Actions deploy workflow before every deploy, so a
regression can't ship to the live preview. Covers:

- Policy type detection and named insured extraction for all 6 sample
  policies
- Negation handling ("does not include X" / "X is not included" / "X is
  excluded"), including the sentence-boundary-clipping regression this
  logic went through during development
- A structural guard against a specific bug class found during development:
  a "gap" rule sharing an exact keyword with a "coverage" rule in the same
  rule set, which double-reports the same real-world concept
- Full-pipeline sanity checks (score bounds, non-empty results) against
  every sample policy

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
Score 87/100, sample carrier "Sample Insurance Co," and the gaps: no rental
reimbursement, no umbrella policy referenced, roadside assistance not
listed. Upload a real file (or one of the 6 samples in `sample-policies/`)
and every screen switches to reflect that document's actual analysis
instead, saved to your Reports history.

## Before this goes anywhere near real users

- [ ] Swap placeholder testimonials for real, permissioned quotes
- [ ] Replace mock AI review/scoring with actual document extraction logic
      (keep the `NEEDED INFORMATION` / "never guarantee" rules from the
      Master Project instructions)
- [ ] Add real authentication and encrypted document storage
- [ ] Privacy, security, legal, and insurance-compliance review
- [ ] Confirm color contrast and screen-reader behavior (basic semantic HTML
      is in place, but this hasn't had a full accessibility audit)

## Notes for whoever picks this up next

- Tailwind theme (`tailwind.config.js`) defines the `compass-*` color
  palette (navy, blue, sky blue, green, mint, amber) used throughout — this
  is a first pass at the "blue, green, white" brand direction from the
  design brief and can be adjusted without touching component code.
- Every page that shows AI-generated content displays a visible disclaimer,
  not just a footer link, per the "non-negotiable guardrails" section of the
  build brief.
