import { beforeEach, describe, expect, it } from 'vitest'
import { TOKEN_KEY, loadToken, persistToken } from './AuthContext.jsx'

// Same reasoning as PolicyContext.test.js: vitest's default environment has
// no `localStorage` global, and loadToken/persistToken wrap access in
// try/catch so any error (including a missing global) falls back to a safe
// default - a minimal in-memory stand-in lets these tests actually exercise
// the real read/write logic instead of only the catch branch.
function createMemoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

beforeEach(() => {
  globalThis.localStorage = createMemoryStorage()
})

describe('loadToken', () => {
  it('returns null when nothing is stored', () => {
    expect(loadToken()).toBeNull()
  })

  it('returns a previously stored token', () => {
    localStorage.setItem(TOKEN_KEY, 'abc123')
    expect(loadToken()).toBe('abc123')
  })

  it('falls back to null if localStorage throws', () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadToken()).toBeNull()
  })
})

describe('persistToken', () => {
  it('stores a token under TOKEN_KEY', () => {
    persistToken('sometoken')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('sometoken')
  })

  it('removes the stored token when given null', () => {
    localStorage.setItem(TOKEN_KEY, 'sometoken')
    persistToken(null)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('does not throw if localStorage is unavailable', () => {
    globalThis.localStorage = {
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(() => persistToken('x')).not.toThrow()
  })
})
