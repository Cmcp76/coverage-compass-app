// Password hashing and session tokens using the Web Crypto API, which
// Workers support natively - no external crypto library needed (bcrypt
// itself isn't available without a WASM build; PBKDF2 via crypto.subtle is
// the standard equivalent that ships built in).

const PBKDF2_ITERATIONS = 100_000
const SALT_BYTES = 16
const KEY_LENGTH_BITS = 256

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

async function deriveBits(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH_BITS,
  )
  return toHex(bits)
}

// Stored format: "pbkdf2:<iterations>:<saltHex>:<hashHex>" - the iteration
// count travels with the hash so a future bump to PBKDF2_ITERATIONS doesn't
// break verifying passwords hashed under the old, lower count.
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2:${PBKDF2_ITERATIONS}:${toHex(salt)}:${hash}`
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyPassword(password, storedHash) {
  const parts = String(storedHash).split(':')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const [, iterationsStr, saltHex, expectedHash] = parts
  const iterations = Number(iterationsStr)
  if (!Number.isInteger(iterations) || iterations <= 0) return false
  const candidateHash = await deriveBits(password, fromHex(saltHex), iterations)
  // Constant-time comparison so response timing can't leak how many
  // leading hex characters of a guess were correct.
  return timingSafeEqual(candidateHash, expectedHash)
}

// A bare crypto.randomUUID() session id is convenient but predictable in
// structure (UUID v4 format), which is fine for a primary key but not for
// something used as a bearer credential - generate a separate, wider
// random token for that purpose and only ever store its hash (see below),
// mirroring the password-hash-not-password approach.
export function generateSessionToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return toHex(digest)
}

export function generateId() {
  return crypto.randomUUID()
}
