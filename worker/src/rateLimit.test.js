import { describe, it, expect, vi } from 'vitest'
import { checkRateLimit, getClientKey } from './rateLimit.js'

// Minimal in-memory stand-in for a Workers KV namespace, just enough of
// the get/put contract this module actually uses (JSON get, put with
// expirationTtl) - doesn't attempt to simulate KV's eventual consistency,
// since that's a property of the real distributed store, not something a
// unit test needs to reproduce to verify this module's own logic.
function makeFakeKV() {
  const store = new Map()
  return {
    async get(key, opts) {
      const raw = store.get(key)
      if (raw === undefined) return null
      return opts?.type === 'json' ? JSON.parse(raw) : raw
    },
    async put(key, value) {
      store.set(key, value)
    },
    _store: store,
  }
}

describe('checkRateLimit', () => {
  it('allows the first request in a fresh window', async () => {
    const env = { RATE_LIMIT_KV: makeFakeKV() }
    const result = await checkRateLimit(env, '1.2.3.4', { limit: 5, windowSeconds: 3600 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.configured).toBe(true)
  })

  it('counts down remaining across successive requests within the window', async () => {
    const env = { RATE_LIMIT_KV: makeFakeKV() }
    await checkRateLimit(env, '1.2.3.4', { limit: 3, windowSeconds: 3600 })
    await checkRateLimit(env, '1.2.3.4', { limit: 3, windowSeconds: 3600 })
    const third = await checkRateLimit(env, '1.2.3.4', { limit: 3, windowSeconds: 3600 })
    expect(third.allowed).toBe(true)
    expect(third.remaining).toBe(0)
  })

  it('rejects once the limit is exceeded within the window', async () => {
    const env = { RATE_LIMIT_KV: makeFakeKV() }
    await checkRateLimit(env, '1.2.3.4', { limit: 2, windowSeconds: 3600 })
    await checkRateLimit(env, '1.2.3.4', { limit: 2, windowSeconds: 3600 })
    const fourth = await checkRateLimit(env, '1.2.3.4', { limit: 2, windowSeconds: 3600 })
    expect(fourth.allowed).toBe(false)
    expect(fourth.remaining).toBe(0)
  })

  it('tracks separate IPs independently', async () => {
    const env = { RATE_LIMIT_KV: makeFakeKV() }
    await checkRateLimit(env, '1.1.1.1', { limit: 1, windowSeconds: 3600 })
    const otherIp = await checkRateLimit(env, '2.2.2.2', { limit: 1, windowSeconds: 3600 })
    expect(otherIp.allowed).toBe(true)
  })

  it('resets the count once the window has elapsed', async () => {
    vi.useFakeTimers()
    try {
      const env = { RATE_LIMIT_KV: makeFakeKV() }
      await checkRateLimit(env, '1.2.3.4', { limit: 1, windowSeconds: 60 })
      const blocked = await checkRateLimit(env, '1.2.3.4', { limit: 1, windowSeconds: 60 })
      expect(blocked.allowed).toBe(false)

      vi.advanceTimersByTime(61 * 1000)

      const afterReset = await checkRateLimit(env, '1.2.3.4', { limit: 1, windowSeconds: 60 })
      expect(afterReset.allowed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('fails open when RATE_LIMIT_KV is not bound', async () => {
    const result = await checkRateLimit({}, '1.2.3.4', { limit: 5, windowSeconds: 3600 })
    expect(result.allowed).toBe(true)
    expect(result.configured).toBe(false)
  })
})

describe('getClientKey', () => {
  it('reads CF-Connecting-IP', () => {
    const request = new Request('https://example.com', { headers: { 'CF-Connecting-IP': '9.9.9.9' } })
    expect(getClientKey(request)).toBe('9.9.9.9')
  })

  it('falls back to "unknown" when the header is missing', () => {
    const request = new Request('https://example.com')
    expect(getClientKey(request)).toBe('unknown')
  })
})
