// Auth route handlers. Each returns a plain { status, body, headers? }
// object rather than a Response directly, so these are easy to unit test
// without constructing real Request/Response objects, and so index.js's
// router stays the only place that actually builds a Response.

import { hashPassword, verifyPassword, generateSessionToken, hashToken, generateId } from './auth.js'
import { createUser, findUserByEmail, createSession, findSessionUser, deleteSessionByTokenHash } from './db.js'

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30 // 30 days
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function publicUser(user) {
  return { id: user.id, email: user.email, fullName: user.full_name ?? user.fullName ?? null }
}

export function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

// Resolves the request's bearer token to a user row, or null if there's no
// token, the token doesn't match any session, or the session has expired
// (findSessionUser's query already filters those out at the SQL level).
export async function requireAuth(request, env) {
  const token = getBearerToken(request)
  if (!token) return null
  const tokenHash = await hashToken(token)
  return (await findSessionUser(env.DB, tokenHash)) || null
}

async function buildSession(userId) {
  const token = generateSessionToken()
  const tokenHash = await hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000)
  return {
    token,
    session: {
      id: generateId(),
      userId,
      tokenHash,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  }
}

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function handleSignup(request, env) {
  const body = await readJsonBody(request)
  if (!body) return { status: 400, body: { error: 'Request body must be JSON.' } }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''

  if (!EMAIL_PATTERN.test(email)) {
    return { status: 400, body: { error: 'Enter a valid email address.' } }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: 400, body: { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` } }
  }

  const existing = await findUserByEmail(env.DB, email)
  if (existing) {
    return { status: 409, body: { error: 'An account with that email already exists.' } }
  }

  const id = generateId()
  const createdAt = new Date().toISOString()
  const passwordHash = await hashPassword(password)
  await createUser(env.DB, { id, email, passwordHash, fullName: fullName || null, createdAt })

  const { token, session } = await buildSession(id)
  await createSession(env.DB, session)

  return {
    status: 201,
    body: { token, user: publicUser({ id, email, fullName: fullName || null }) },
  }
}

export async function handleLogin(request, env) {
  const body = await readJsonBody(request)
  if (!body) return { status: 400, body: { error: 'Request body must be JSON.' } }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  // Same generic error whether the account doesn't exist or the password
  // is wrong - a distinct "no account with that email" message would let
  // someone enumerate which emails have accounts here.
  const invalidCredentials = { status: 401, body: { error: 'Incorrect email or password.' } }

  const user = await findUserByEmail(env.DB, email)
  if (!user) return invalidCredentials

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return invalidCredentials

  const { token, session } = await buildSession(user.id)
  await createSession(env.DB, session)

  return { status: 200, body: { token, user: publicUser(user) } }
}

export async function handleLogout(request, env) {
  const token = getBearerToken(request)
  if (token) {
    await deleteSessionByTokenHash(env.DB, await hashToken(token))
  }
  // Logging out with no/an already-invalid token isn't an error - the end
  // state the caller wants (not logged in) is already true either way.
  return { status: 200, body: { success: true } }
}

export async function handleMe(request, env) {
  const user = await requireAuth(request, env)
  if (!user) return { status: 401, body: { error: 'Not authenticated.' } }
  return { status: 200, body: { user: publicUser(user) } }
}
