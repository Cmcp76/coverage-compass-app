# Roadmap: Prototype → Real Product

This is a sequenced plan for taking Coverage Compass from its current state (a
polished, functional prototype running entirely in the browser on mock data)
to something that can safely handle real users and real policy documents.

Effort estimates assume a small team (1-3 engineers) and are rough. The
biggest source of schedule risk isn't listed as a time estimate at all: **the
document-AI accuracy bar**, and **legal/compliance review**, both run on
their own clocks and aren't things engineering effort alone shortens.

## Phase 0 — Foundations (do first, everything else depends on these)

| Item | Est. | Notes |
|---|---|---|
| Real authentication | 1–2 wks | Use a managed provider (Clerk, Auth0, Supabase Auth) rather than building custom. Replaces the current "routes just navigate forward" mock. |
| Database + encrypted document storage | 3–5 days | Postgres for user/policy records, S3-compatible storage with encryption at rest for uploaded documents. |
| Real backend for the analysis pipeline | 3–5 days | Today `policyAnalysis.js` runs entirely client-side. Move it server-side once real documents carry PII, both for security and to support a real extraction API (below). |

**Blocks:** everything in Phase 1 that touches a signed-in user's real data.

## Phase 1 — Make the core product real

| Item | Est. | Notes |
|---|---|---|
| Real document extraction/OCR | 2–6+ wks, then ongoing tuning | Wire a vendor doc-AI API (AWS Textract, Google Document AI, Azure Form Recognizer) feeding into an LLM parsing/classification layer. Keep the existing `NEEDED INFORMATION` / "never guarantee" rules — they're the right safety pattern, just need a real extraction backend under them. |
| Re-validate the 5 line-of-business rule sets against real documents | ongoing | The current keyword rules were tuned against 5 sample `.txt` files. Expect false positives/negatives on real declarations pages and messy PDFs; budget an accuracy-improvement loop, not a one-time port. |
| Payments/subscriptions (if monetizing) | 1–2 wks | Stripe integration; skip entirely if the product stays free/lead-gen. |

**Blocks:** any claim that the product's output is trustworthy enough to show a real user.

## Phase 2 — Trust, legal, and compliance

These aren't engineering tasks and won't move faster by throwing more code at
them. Sequence them in parallel with Phase 1, not after.

| Item | Est. | Owner |
|---|---|---|
| Privacy Policy, Terms of Service | days–weeks | Legal (currently the footer links to these go nowhere — placeholder scope, called out in the README) |
| Insurance-compliance review | varies by state | Legal/compliance — this product gives educational content adjacent to insurance advice; confirm what's permissible without a producer license in each state you operate in |
| Security review | 1–2 wks internal, longer if a formal audit (e.g., SOC 2) is required | Depends on whether you're handling PII/financial documents at scale — likely yes here |
| Real, permissioned testimonials | weeks–months | Business/marketing — depends on getting an actual user base first |

## Phase 3 — Polish for launch

| Item | Est. | Notes |
|---|---|---|
| Full accessibility audit | 3–5 days | I did spot-checks (semantic headings, aria-labels, keyboard nav, focus states) during the prototype pass, but a full WCAG audit with a screen reader is still needed. |
| Load/performance testing | few days | Route-level code splitting is already in place; verify under real traffic. |
| Monitoring/error tracking | 2–3 days | Sentry or equivalent — nothing is wired up currently. |

## Suggested sequencing

```
Phase 0 (foundations)
   ↓
Phase 1 (real extraction) ──── Phase 2 (legal/compliance, parallel track)
   ↓                                ↓
        Phase 3 (launch polish)
           ↓
         Launch
```

Phase 2 should start in parallel with Phase 1, not after it — legal and
compliance timelines are usually the long pole, not engineering.

## What NOT to do

- Don't build custom OCR/ML instead of using a vendor API — that's a
  multi-month research project, not a startup's Phase 1.
- Don't skip the `NEEDED INFORMATION` / uncertainty-labeling pattern already
  in the codebase when you swap in real extraction — it's the load-bearing
  safety mechanism that keeps the product from confidently stating something
  false about someone's coverage.
- Don't treat the legal/compliance track as a final step before launch — by
  the time Phase 1 is done, it should already be in progress.
