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
  status tags (not red/alert styling) and generated questions
- **Professional Report** — printable page (`window.print()`) matching the
  cover → score → summary → strengths → gaps → questions → next steps →
  disclaimer structure
- **Insurance Learning Center** — searchable/filterable articles + glossary
  preview
- **Interactive Tools** — all six tools are functional: Deductible Calculator,
  Risk Assessment Quiz, Home Inventory Checklist (with CSV export), Coverage
  Comparison Tool, Annual Insurance Checkup, and a full searchable Glossary

## The analysis engine (`src/lib/policyAnalysis.js`)

This is the most "real" part of the prototype. Upload a file and it:

1. Extracts actual text from the PDF (via `pdfjs-dist`, entirely in your
   browser, nothing is sent to a server) or reads a `.txt` file directly
2. Detects which **line of business** the document is — personal/commercial
   auto, homeowners, commercial general liability, workers' compensation, or
   trucking/motor carrier — based on keyword signals
3. Applies a rule set specific to that line of business to identify
   coverages present, coverages missing (`NEEDED INFORMATION`), and common
   gaps worth a second look
4. Feeds the result into the Coverage Score, Gap Report, Professional
   Report, and Dashboard — all live off the same shared analysis, not
   independent static copies

**Try it**: five sample `.txt` policies are in `sample-policies/` — one each
for auto, homeowners, general liability, workers' comp, and trucking. Upload
each one and watch the coverages, gaps, and score change to match.

**Be clear-eyed about what this is**: it's keyword matching, not real AI
document understanding. It'll miss nuance, get fooled by unfamiliar phrasing,
and shouldn't be mistaken for production-grade extraction. It's a
meaningfully more realistic prototype than a static mock, not a finished
product.

All copy is pulled verbatim from the approved copy deck — headlines, CTAs,
and disclaimers were not paraphrased.

## What's intentionally NOT built yet

Per the build brief's guardrails:

- Real document extraction/OCR (the "AI scanning" step is a timed mock)
- Real user accounts/database/auth (routes just navigate forward)
- Payments or subscriptions
- Carrier marketplace or quoting
- Mobile app (this is responsive web, not native)

## Sample data

All screens use one consistent fictional auto policy
(`src/data/mockData.js`) — Coverage Score 87/100, sample carrier "Sample
Insurance Co," and the gaps: no rental reimbursement, no umbrella policy
referenced, roadside assistance not listed. Edit that file to test different
scenarios.

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
