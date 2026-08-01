// A simple per-IP rate limiter backed by Workers KV, so the analysis
// endpoint can reject excess requests BEFORE spending any Anthropic API
// budget on them. Chosen over Cloudflare's native RateLimit binding (newer,
// syntax varies by wrangler version) and Durable Objects (needs a paid
// Workers plan) for the widest compatibility on a fresh free-tier account.
//
// Honest limitation: KV is eventually consistent, not strongly consistent,
// so under concurrent requests from the same IP within the same window this
// can undercount by a request or two - it's a speed bump against casual
// abuse and runaway costs, not a precise distributed rate limiter. That's
// an acceptable tradeoff here: the goal is bounding worst-case spend, not
// perfectly fair quota enforcement.

const KEY_PREFIX = 'ratelimit:'

// Returns { allowed, remaining, limit, resetAt }. `env` must have a KV
// binding named RATE_LIMIT_KV (see wrangler.toml) - if it's missing, this
// fails OPEN (allowed: true) rather than blocking every request, since a
// misconfigured/not-yet-provisioned KV namespace shouldn't take down the
// whole feature for someone who already deployed before this existed.
export async function checkRateLimit(env, clientKey, { limit, windowSeconds }) {
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, remaining: limit, limit, resetAt: null, configured: false }
  }

  const key = `${KEY_PREFIX}${clientKey}`
  const now = Date.now()
  const raw = await env.RATE_LIMIT_KV.get(key, { type: 'json' })

  // No record yet, or the previous window has fully elapsed - start fresh.
  if (!raw || raw.windowStart + windowSeconds * 1000 <= now) {
    const resetAt = now + windowSeconds * 1000
    await env.RATE_LIMIT_KV.put(key, JSON.stringify({ windowStart: now, count: 1 }), {
      expirationTtl: windowSeconds,
    })
    return { allowed: true, remaining: limit - 1, limit, resetAt, configured: true }
  }

  const resetAt = raw.windowStart + windowSeconds * 1000
  if (raw.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt, configured: true }
  }

  const nextCount = raw.count + 1
  // TTL is relative to now, not the original window start, but since we
  // only reach this branch when the window hasn't elapsed yet, this can
  // only shrink the remaining TTL toward the correct expiry, never extend
  // it past the real window end.
  const remainingWindowSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000))
  await env.RATE_LIMIT_KV.put(key, JSON.stringify({ windowStart: raw.windowStart, count: nextCount }), {
    expirationTtl: remainingWindowSeconds,
  })
  return { allowed: true, remaining: limit - nextCount, limit, resetAt, configured: true }
}

// CF-Connecting-IP is set by Cloudflare's edge on every request reaching a
// Worker and can't be spoofed by the client (unlike X-Forwarded-For, which
// a direct caller could set to anything) - the right identity key for a
// rate limiter that needs to survive someone bypassing the app's own UI
// and calling this endpoint directly.
export function getClientKey(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown'
}
