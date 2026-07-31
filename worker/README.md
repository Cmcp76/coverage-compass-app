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

Nothing in this repo has been tested against the real Anthropic API — the
environment this Worker was built in didn't have API credentials. Once
you've deployed and configured a key, upload one of the sample policies in
`sample-policies/` and confirm:

1. The review completes and `FallbackAnalysisBanner` does **not** appear
   (if it does, something failed and the app silently used the fallback —
   check `wrangler tail` for the actual error)
2. The coverages/gaps/score look sane for that sample policy
3. `npx wrangler tail` while testing shows the request landing and
   succeeding

## Cost

This calls the Claude API on every upload that isn't demo data. Each call
sends the full extracted policy text plus a system prompt (a few thousand
tokens) and gets back a structured JSON response. Check
[Anthropic's current pricing](https://www.anthropic.com/pricing) for the
model in use (`MODEL` in `src/index.js`) and estimate against your expected
upload volume before this is live for real traffic.

## Known gaps before this is production-hardened

- **No rate limiting or request auth.** Anyone who finds this Worker's URL
  can call it directly (not just through the app's UI) and spend your
  Anthropic API budget. For real traffic, add rate limiting (Cloudflare
  has built-in options — see
  [Rate Limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
  — or a lighter-weight per-IP check via a Durable Object/KV) and/or
  require a request to come from your own frontend somehow (this is
  genuinely hard to do robustly for a public SPA with no user login; don't
  treat CORS as a security boundary, it only stops browsers, not direct
  API calls).
- **No monitoring/alerting.** `wrangler tail` works for live debugging but
  isn't a substitute for actual error-rate/spend alerting in production.
- **No retry logic.** A single Anthropic API hiccup fails the request
  immediately (the frontend then falls back to the local engine, so the
  user experience degrades gracefully, but a transient failure that a retry
  would have fixed instead silently downgrades their review quality).
