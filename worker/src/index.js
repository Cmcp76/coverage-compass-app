// Cloudflare Worker backing Coverage Compass: real LLM policy analysis
// (POST /analyze), plus real accounts and server-side saved reviews
// (/auth/*, /me, /analyses*). Exists ONLY because an Anthropic API key and
// a database can't live in client-side code - everything about *what* each
// route does lives in plain JS modules with no Workers-specific code
// (mapAnalysis.js/buildPrompt.js, authRoutes.js, analysesRoutes.js, db.js),
// so they're unit tested without needing a deployed Worker. This file is
// the thin part that's actually Workers-specific: routing, CORS, and
// wiring env bindings through.
//
// See worker/README.md for deployment steps. Per-IP rate limiting (see
// rateLimit.js) bounds worst-case API spend and login/signup abuse, but
// there's still no deeper request auth on /analyze - CORS only stops
// browsers, not a direct curl/script call, so it remains a "reasonable
// speed bump," not a hard security boundary. Still no monitoring/alerting
// either, called out as a further follow-up in the README.

import { ANALYSIS_TOOL } from './schema.js'
import { buildSystemPrompt } from './buildPrompt.js'
import { mapClaudeResultToAnalysis } from './mapAnalysis.js'
import { checkRateLimit, getClientKey } from './rateLimit.js'
import { handleSignup, handleLogin, handleLogout, handleMe, requireAuth } from './authRoutes.js'
import { handleSaveAnalysis, handleListAnalyses, handleGetAnalysis, handleDeleteAnalysis } from './analysesRoutes.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'
// A real policy document rarely exceeds a few thousand words even
// uncompressed; this is generous headroom while still bounding the token
// (and therefore dollar) cost of a single request someone could otherwise
// inflate arbitrarily by POSTing directly to this endpoint.
const MAX_TEXT_LENGTH = 60000
// Generous enough for genuine personal use (reviewing a handful of real
// policies) while meaningfully capping how much of your Anthropic budget
// one IP can spend. Override via RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_SECONDS
// in wrangler.toml [vars] if you want a different tradeoff.
const DEFAULT_RATE_LIMIT_MAX = 10
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 3600
// Much tighter than the analysis limit and on its own counter (see the
// "auth:" key prefix below) - a login/signup endpoint is a brute-force /
// spam-account target in a way "analyze my policy" isn't, so it needs a
// stricter, independent budget rather than sharing the analysis one.
const AUTH_RATE_LIMIT_MAX = 10
const AUTH_RATE_LIMIT_WINDOW_SECONDS = 900

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

async function enforceRateLimit(request, env, headers, { keyPrefix, limit, windowSeconds }) {
  const clientKey = `${keyPrefix}:${getClientKey(request)}`
  const rate = await checkRateLimit(env, clientKey, { limit, windowSeconds })
  if (rate.allowed) return null
  const retryAfterSeconds = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
  return json(
    { error: `Too many requests. Try again in about ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
    429,
    { ...headers, 'Retry-After': String(retryAfterSeconds) },
  )
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

async function handleAnalyze(request, env, headers) {
  const limitResponse = await enforceRateLimit(request, env, headers, {
    keyPrefix: 'analyze',
    limit: Number(env.RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX,
    windowSeconds: Number(env.RATE_LIMIT_WINDOW_SECONDS) || DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
  })
  if (limitResponse) return limitResponse

  if (!env.ANTHROPIC_API_KEY) {
    // A missing secret is a deploy-configuration mistake, not a client
    // error - 500, not 400, and a message that points at the fix.
    return json({ error: 'Server is not configured with an ANTHROPIC_API_KEY.' }, 500, headers)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400, headers)
  }

  const text = typeof body?.text === 'string' ? body.text : ''
  if (!text.trim()) {
    return json({ error: 'Missing required "text" field.' }, 400, headers)
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: `"text" exceeds the ${MAX_TEXT_LENGTH}-character limit for this endpoint.` }, 413, headers)
  }

  const fileName = typeof body?.fileName === 'string' ? body.fileName : undefined
  const truncated = Boolean(body?.truncated)

  let anthropicResponse
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: `Here is the uploaded policy document text:\n\n${text}` }],
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: ANALYSIS_TOOL.name },
      }),
    })
  } catch (err) {
    return json({ error: `Could not reach the analysis service: ${err.message}` }, 502, headers)
  }

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text().catch(() => '')
    return json(
      { error: `Analysis service returned an error (${anthropicResponse.status}).`, detail: errText.slice(0, 500) },
      502,
      headers,
    )
  }

  const data = await anthropicResponse.json()
  const toolUse = data?.content?.find((block) => block.type === 'tool_use' && block.name === ANALYSIS_TOOL.name)
  if (!toolUse) {
    return json({ error: 'Analysis service did not return a structured result.' }, 502, headers)
  }

  const analysis = mapClaudeResultToAnalysis(toolUse.input, {
    fileName,
    truncated,
    hasRealText: text.trim().length > 40,
  })

  return json({ analysis }, 200, headers)
}

// Converts a route handler's plain { status, body } return value into a
// real Response, keeping the handlers themselves (in authRoutes.js /
// analysesRoutes.js) free of any Workers-specific Response/Headers code -
// that's what makes them straightforward to unit test with plain objects.
function toResponse(result, headers) {
  return json(result.body, result.status, headers)
}

async function requireAuthOrRespond(request, env, headers) {
  const user = await requireAuth(request, env)
  if (!user) return { error: json({ error: 'Not authenticated.' }, 401, headers) }
  return { user }
}

// D1 is opt-in (see wrangler.toml) - without it, these routes should say
// so clearly rather than throwing on the first `env.DB.prepare(...)` call
// and surfacing as an opaque "Unexpected server error."
function requireDbConfigured(env, headers) {
  if (env.DB) return null
  return json({ error: 'Server is not configured with a database (accounts are not available on this deployment).' }, 500, headers)
}

async function handleAuthRoute(request, env, headers, handler, { keyPrefix }) {
  const limitResponse = await enforceRateLimit(request, env, headers, {
    keyPrefix,
    limit: Number(env.AUTH_RATE_LIMIT_MAX) || AUTH_RATE_LIMIT_MAX,
    windowSeconds: Number(env.AUTH_RATE_LIMIT_WINDOW_SECONDS) || AUTH_RATE_LIMIT_WINDOW_SECONDS,
  })
  if (limitResponse) return limitResponse
  return toResponse(await handler(request, env), headers)
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const url = new URL(request.url)
    const { pathname } = url
    const { method } = request

    try {
      if (pathname === '/analyze' && method === 'POST') {
        return await handleAnalyze(request, env, headers)
      }

      const analysisIdMatch = pathname.match(/^\/analyses\/([^/]+)$/)
      const isAccountsRoute =
        pathname === '/auth/signup' ||
        pathname === '/auth/login' ||
        pathname === '/auth/logout' ||
        pathname === '/me' ||
        pathname === '/analyses' ||
        Boolean(analysisIdMatch)
      if (isAccountsRoute) {
        const dbError = requireDbConfigured(env, headers)
        if (dbError) return dbError
      }

      if (pathname === '/auth/signup' && method === 'POST') {
        return await handleAuthRoute(request, env, headers, handleSignup, { keyPrefix: 'auth-signup' })
      }
      if (pathname === '/auth/login' && method === 'POST') {
        return await handleAuthRoute(request, env, headers, handleLogin, { keyPrefix: 'auth-login' })
      }
      if (pathname === '/auth/logout' && method === 'POST') {
        return toResponse(await handleLogout(request, env), headers)
      }
      if (pathname === '/me' && method === 'GET') {
        return toResponse(await handleMe(request, env), headers)
      }

      if (pathname === '/analyses' && method === 'GET') {
        const { user, error } = await requireAuthOrRespond(request, env, headers)
        if (error) return error
        return toResponse(await handleListAnalyses(request, env, user), headers)
      }
      if (pathname === '/analyses' && method === 'POST') {
        const { user, error } = await requireAuthOrRespond(request, env, headers)
        if (error) return error
        return toResponse(await handleSaveAnalysis(request, env, user), headers)
      }

      if (analysisIdMatch && method === 'GET') {
        const { user, error } = await requireAuthOrRespond(request, env, headers)
        if (error) return error
        return toResponse(await handleGetAnalysis(env, user, analysisIdMatch[1]), headers)
      }
      if (analysisIdMatch && method === 'DELETE') {
        const { user, error } = await requireAuthOrRespond(request, env, headers)
        if (error) return error
        return toResponse(await handleDeleteAnalysis(env, user, analysisIdMatch[1]), headers)
      }

      if (pathname === '/analyze' || pathname === '/auth/signup' || pathname === '/auth/login' || pathname === '/auth/logout' || pathname === '/analyses' || analysisIdMatch) {
        return json({ error: 'Method not allowed.' }, 405, headers)
      }

      return json({ error: 'Not found.' }, 404, headers)
    } catch (err) {
      return json({ error: `Unexpected server error: ${err.message}` }, 500, headers)
    }
  },
}
