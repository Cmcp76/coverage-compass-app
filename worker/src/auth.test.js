import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, generateSessionToken, hashToken, generateId } from './auth.js'

describe('hashPassword / verifyPassword', () => {
  it('verifies a correct password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('correct horse battery staple')
    expect(await verifyPassword('wrong password', hash)).toBe(false)
  })

  it('produces a different hash each time (random salt)', async () => {
    const a = await hashPassword('same password')
    const b = await hashPassword('same password')
    expect(a).not.toBe(b)
    expect(await verifyPassword('same password', a)).toBe(true)
    expect(await verifyPassword('same password', b)).toBe(true)
  })

  it('stores the algorithm and iteration count alongside the hash', async () => {
    const hash = await hashPassword('x')
    const parts = hash.split(':')
    expect(parts[0]).toBe('pbkdf2')
    expect(Number(parts[1])).toBeGreaterThan(0)
  })

  it('rejects a malformed stored hash instead of throwing', async () => {
    await expect(verifyPassword('anything', 'not-a-real-hash')).resolves.toBe(false)
    await expect(verifyPassword('anything', '')).resolves.toBe(false)
  })
})

describe('generateSessionToken / hashToken', () => {
  it('generates a long, unpredictable token', () => {
    const a = generateSessionToken()
    const b = generateSessionToken()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(48)
  })

  it('hashes deterministically so a lookup can match a stored hash', async () => {
    const token = generateSessionToken()
    const h1 = await hashToken(token)
    const h2 = await hashToken(token)
    expect(h1).toBe(h2)
    expect(h1).not.toBe(token)
  })

  it('produces different hashes for different tokens', async () => {
    const h1 = await hashToken(generateSessionToken())
    const h2 = await hashToken(generateSessionToken())
    expect(h1).not.toBe(h2)
  })
})

describe('generateId', () => {
  it('generates unique ids', () => {
    expect(generateId()).not.toBe(generateId())
  })
})
