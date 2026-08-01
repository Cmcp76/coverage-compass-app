# Coverage Compass analysis Worker

A small Cloudflare Worker that proxies policy-analysis requests to the
Claude API. It exists for one reason: an API key can never live in
client-side code (anyone can open dev tools and read it), so something
server-side has to hold it and make the actual call.

Everything about *what* the analysis looks like — the prompt, the coverage/
gap rule sets, the scoring formula — lives in plain JS modules
(`src/buildPrompt.js`, `src/mapAnalysis.js`, and the shared
`../src/lib/policyDomainKnowledge.js`) with no Cloudflare-specific code, so
they're unit tested with plain Vitest and don't require a deployed Worker or
a real API key to verify. `src/index.js` is the thin part that's actually
Workers-specific: routing, CORS, and the `fetch()` call to Anthropic.

## What you need before you start

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (the free
  tier is enough for this — 100,000 requests/day)
- An [Anthropic API key](https://console.anthropic.com/settings/keys) with
  billing enabled (this is a **paid** API — see "Cost" below)
- Node.js and npm (already required for the main app)

## One-time setup

```bash
cd worker
npm install
npx wrangler login   # opens a browser tab to authorize wrangler against your Cloudflare account
```

Set your Anthropic API key as a Worker **secret** — never put it in
`wrangler.toml` or any file that gets committed:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# paste your key when prompted
```

If your GitHub Pages site isn't at `https://cmcp76.github.io/coverage-compass-app`
(a fork, a custom domain, etc.), update `ALLOWED_ORIGINS` in `wrangler.toml`
to match — this is a CORS allow-list, so a mismatch here means the browser
will block the frontend's requests to this Worker even though the Worker
itself is running fine.

## Turning on rate limiting (recommended before real traffic)

Anyone who finds this Worker's URL can call it directly — not just through
the app's UI — so without rate limiting, one person could spend your entire
Anthropic budget. `wrangler.toml` ships with the KV binding for this
commented out, so deploying as-is works with no extra steps but also with
no rate limiting (same as before this existed). To turn it on:

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

This prints an `id`. Open `wrangler.toml`, uncomment the `[[kv_namespaces]]`
block near the bottom, and paste that id in. `RATE_LIMIT_MAX` /
`RATE_LIMIT_WINDOW_SECONDS` in `[vars]` control the threshold (default: 10
requests per IP per hour) — change those numbers to taste, no code changes
needed. Redeploy (`npx wrangler deploy`) for it to take effect.

## Deploy

```bash
npx wrangler deploy
```

This prints the Worker's URL, something like:

```
https://coverage-compass-analyze.<your-subdomain>.workers.dev
```

Copy that URL — the frontend needs it next.

## Point the frontend at it

The Vite app reads the Worker's base URL from `VITE_ANALYSIS_API_URL` at
**build time** (not runtime — this becomes a static string baked into the
built JS, standard for a Vite env var). Two ways to set it:

**For the GitHub Actions deploy** (`.github/workflows/deploy.yml` already
passes this through): go to the repo's Settings > Secrets and variables >
Actions > Variables tab, add a repository variable named
`VITE_ANALYSIS_API_URL` with the Worker URL from above, then re-run the
workflow (or push a commit). It's a Variable, not a Secret — the URL isn't
sensitive, it ends up visible in the built JS bundle either way.

**For a local production build** (running `npm run build` yourself instead
of via CI), create `coverage-compass-app/.env.production.local` (gitignored
— this repo doesn't commit any file with your actual deployed Worker URL in
it, since that's specific to your Cloudflare account and shouldn't be
assumed to be the same for anyone else who clones this repo):

```
VITE_ANALYSIS_API_URL=https://coverage-compass-analyze.<your-subdomain>.workers.dev
```

Leaving `VITE_ANALYSIS_API_URL` unset is a supported, intentional state —
the app falls back to the local pattern-matching engine automatically (see
the main README's "The analysis engine" section) and works exactly as it
does today. You don't have to deploy this Worker for the app to work; you
have to deploy it for the app to use **real AI analysis** instead of the
keyword-matching fallback.

## Local development

```bash
cd worker
echo 'ANTHROPIC_API_KEY="sk-ant-..."' > .dev.vars   # gitignored, never commit this
npx wrangler dev
```

This runs the Worker locally (default `http://localhost:8787`), simulating
Cloudflare's runtime via Miniflare and reading the key from `.dev.vars`
instead of a deployed secret. Point the frontend at it for local end-to-end
testing by setting `VITE_ANALYSIS_API_URL=http://localhost:8787` in
`coverage-compass-app/.env.local` (also gitignored by the root `.gitignore`'s
convention — Vite auto-loads `.env.local` and it should never be committed).

## Verifying it actually works

Confirmed working end-to-end against the real Anthropic API on a live
deployment: a real uploaded policy produced a review citing specifics that
only exist in that document (a named driver, a specific vehicle, discount
line items) — not something the keyword-matching fallback could ever
produce. To verify your own deployment, upload a real policy (or one of the
samples in `sample-policies/`) and confirm:

1. The review completes and `FallbackAnalysisBanner` does **not** appear
   (if it does, something failed and the app silently used the fallback —
   check `wrangler tail` for the actual error)
2. The coverages/gaps/score look sane, and the strengths/questions
   reference specifics that are actually in the document you uploaded
3. `npx wrangler tail` while testing shows the request landing and
   succeeding
4. If you turned on rate limiting: make more than `RATE_LIMIT_MAX` requests
   in a row and confirm the extra ones get a 429 with a `Retry-After`
   header instead of reaching Anthropic

## Cost

This calls the Claude API on every upload that isn't demo data. Each call
sends the full extracted policy text plus a system prompt (a few thousand
tokens) and gets back a structured JSON response. Check
[Anthropic's current pricing](https://www.anthropic.com/pricing) for the
model in use (`MODEL` in `src/index.js`) and estimate against your expected
upload volume before this is live for real traffic.

## Known gaps before this is production-hardened

- **Rate limiting exists but is opt-in, and it's a speed bump, not a
  security boundary.** See "Turning on rate limiting" above — until you
  enable it, there's no cap on requests at all. Even enabled, it's a
  per-IP counter in KV (eventually consistent, not perfectly precise under
  concurrent load) meant to bound worst-case spend from casual abuse, not
  a hard guarantee. There's still no request *auth* — CORS only stops
  browsers, not a direct curl/script call bypassing the app's UI entirely.
  Requiring real auth is genuinely hard to do robustly for a public SPA
  with no user login system; this Worker doesn't attempt it.
- **No monitoring/alerting.** `wrangler tail` works for live debugging but
  isn't a substitute for actual error-rate/spend alerting in production.
- **No retry logic.** A single Anthropic API hiccup fails the request
  immediately (the frontend then falls back to the local engine, so the
  user experience degrades gracefully, but a transient failure that a retry
  would have fixed instead silently downgrades their review quality).
