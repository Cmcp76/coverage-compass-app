// Cloudflare Worker: POST /analyze
//
// Thin proxy in front of the Anthropic API. Exists ONLY because an API key
// can never live in client-side code (anyone can open dev tools and steal
// it) - everything else about "read the policy and produce an analysis" is
// in mapAnalysis.js/buildPrompt.js, which have no Workers-specific code and
// are unit tested without needing a deployed Worker or a real API key.
//
// See worker/README.md for deployment steps. This alone does not make the
// endpoint production-hardened - there's no rate limiting or request
// auth here yet, both called out as follow-ups in that README, since
// anyone who finds this URL can spend your Anthropic API budget.

import { ANALYSIS_TOOL } from './schema.js'
import { buildSystemPrompt } from './buildPrompt.js'
import { mapClaudeResultToAnalysis } from './mapAnalysis.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-4-5-20250929'
// A real policy document rarely exceeds a few thousand words even
// uncompressed; this is generous headroom while still bounding the token
// (and therefore dollar) cost of a single request someone could otherwise
// inflate arbitrarily by POSTing directly to this endpoint.
const MAX_TEXT_LENGTH = 60000

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

async function handleAnalyze(request, env, headers) {
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

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const url = new URL(request.url)
    if (url.pathname !== '/analyze') {
      return json({ error: 'Not found.' }, 404, headers)
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed, use POST.' }, 405, headers)
    }

    try {
      return await handleAnalyze(request, env, headers)
    } catch (err) {
      return json({ error: `Unexpected server error: ${err.message}` }, 500, headers)
    }
  },
}
