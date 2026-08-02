import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSignup, handleLogin, handleLogout, handleMe, requireAuth, getBearerToken } from './authRoutes.js'
import { hashPassword } from './auth.js'
import * as db from './db.js'

vi.mock('./db.js')

function makeRequest(body, { headers } = {}) {
  return new Request('https://example.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const env = { DB: {} }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleSignup', () => {
  it('rejects an invalid email', async () => {
    const result = await handleSignup(makeRequest({ email: 'not-an-email', password: 'longenough' }), env)
    expect(result.status).toBe(400)
    expect(db.createUser).not.toHaveBeenCalled()
  })

  it('rejects a too-short password', async () => {
    const result = await handleSignup(makeRequest({ email: 'a@b.com', password: 'short' }), env)
    expect(result.status).toBe(400)
    expect(db.createUser).not.toHaveBeenCalled()
  })

  it('rejects a duplicate email with 409', async () => {
    db.findUserByEmail.mockResolvedValue({ id: 'existing' })
    const result = await handleSignup(makeRequest({ email: 'a@b.com', password: 'longenough' }), env)
    expect(result.status).toBe(409)
    expect(db.createUser).not.toHaveBeenCalled()
  })

  it('creates a user and session, returning a token and public user on success', async () => {
    db.findUserByEmail.mockResolvedValue(null)
    const result = await handleSignup(makeRequest({ email: 'A@B.com', password: 'longenough', fullName: 'Maria' }), env)
    expect(result.status).toBe(201)
    expect(result.body.token).toEqual(expect.any(String))
    expect(result.body.user.email).toBe('a@b.com') // normalized to lowercase
    expect(result.body.user.fullName).toBe('Maria')
    expect(result.body.user.password_hash).toBeUndefined() // never leak the hash
    expect(db.createUser).toHaveBeenCalledOnce()
    expect(db.createSession).toHaveBeenCalledOnce()
  })

  it('rejects a non-JSON body', async () => {
    const result = await handleSignup(makeRequest(undefined), env)
    expect(result.status).toBe(400)
  })
})

describe('handleLogin', () => {
  it('returns a generic error when no account exists for the email', async () => {
    db.findUserByEmail.mockResolvedValue(null)
    const result = await handleLogin(makeRequest({ email: 'nobody@b.com', password: 'whatever1' }), env)
    expect(result.status).toBe(401)
    expect(result.body.error).not.toMatch(/no account|not found/i)
  })

  it('returns the same generic error for a wrong password (no user enumeration)', async () => {
    const passwordHash = await hashPassword('correctpassword')
    db.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: passwordHash })
    const wrongEmailResult = await handleLogin(makeRequest({ email: 'nobody@b.com', password: 'x' }), env)
    const wrongPasswordResult = await handleLogin(makeRequest({ email: 'a@b.com', password: 'wrongpassword' }), env)
    expect(wrongPasswordResult.status).toBe(401)
    expect(wrongPasswordResult.body.error).toBe(wrongEmailResult.body.error)
  })

  it('logs in successfully with correct credentials', async () => {
    const passwordHash = await hashPassword('correctpassword')
    db.findUserByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: passwordHash, full_name: 'A' })
    const result = await handleLogin(makeRequest({ email: 'a@b.com', password: 'correctpassword' }), env)
    expect(result.status).toBe(200)
    expect(result.body.token).toEqual(expect.any(String))
    expect(result.body.user).toEqual({ id: 'u1', email: 'a@b.com', fullName: 'A' })
    expect(db.createSession).toHaveBeenCalledOnce()
  })
})

describe('handleLogout', () => {
  it('deletes the session for a provided token', async () => {
    const result = await handleLogout(makeRequest(undefined, { headers: { Authorization: 'Bearer sometoken' } }), env)
    expect(result.status).toBe(200)
    expect(db.deleteSessionByTokenHash).toHaveBeenCalledOnce()
  })

  it('succeeds even with no token (already logged out is not an error)', async () => {
    const result = await handleLogout(makeRequest(undefined), env)
    expect(result.status).toBe(200)
    expect(db.deleteSessionByTokenHash).not.toHaveBeenCalled()
  })
})

describe('requireAuth / handleMe', () => {
  it('requireAuth returns null with no Authorization header', async () => {
    expect(await requireAuth(makeRequest(undefined), env)).toBeNull()
  })

  it('requireAuth returns the user for a valid token', async () => {
    db.findSessionUser.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
    const user = await requireAuth(makeRequest(undefined, { headers: { Authorization: 'Bearer validtoken' } }), env)
    expect(user).toEqual({ id: 'u1', email: 'a@b.com' })
  })

  it('handleMe returns 401 when not authenticated', async () => {
    db.findSessionUser.mockResolvedValue(null)
    const result = await handleMe(makeRequest(undefined), env)
    expect(result.status).toBe(401)
  })

  it('handleMe returns the public user shape when authenticated', async () => {
    db.findSessionUser.mockResolvedValue({ id: 'u1', email: 'a@b.com', full_name: 'A', password_hash: 'secret' })
    const result = await handleMe(makeRequest(undefined, { headers: { Authorization: 'Bearer validtoken' } }), env)
    expect(result.status).toBe(200)
    expect(result.body.user).toEqual({ id: 'u1', email: 'a@b.com', fullName: 'A' })
  })
})

describe('getBearerToken', () => {
  it('extracts the token from a well-formed header', () => {
    const request = makeRequest(undefined, { headers: { Authorization: 'Bearer abc123' } })
    expect(getBearerToken(request)).toBe('abc123')
  })

  it('returns null when the header is missing or malformed', () => {
    expect(getBearerToken(makeRequest(undefined))).toBeNull()
    expect(getBearerToken(makeRequest(undefined, { headers: { Authorization: 'abc123' } }))).toBeNull()
  })
})
