import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from './errorClassification.js'

describe('isChunkLoadError', () => {
  it('recognizes Chrome/Edge dynamic import failure messages', () => {
    expect(
      isChunkLoadError(new Error('Failed to fetch dynamically imported module: https://example.com/assets/Report-abc123.js')),
    ).toBe(true)
  })

  it('recognizes Firefox dynamic import failure messages', () => {
    expect(
      isChunkLoadError(new Error('error loading dynamically imported module: https://example.com/assets/Report-abc123.js')),
    ).toBe(true)
  })

  it('recognizes Safari dynamic import failure messages', () => {
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
  })

  it('recognizes a generic "failed to load chunk" style message', () => {
    expect(isChunkLoadError(new Error('Loading chunk 12 failed.'))).toBe(true)
  })

  it('does not flag an ordinary application error as a chunk load failure', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'coverages')"))).toBe(false)
  })

  it('does not flag an unrelated error that merely contains "import" as a substring', () => {
    expect(isChunkLoadError(new Error('This field is important and cannot be blank.'))).toBe(false)
  })

  it('does not flag an unrelated network error with no module/chunk language', () => {
    expect(isChunkLoadError(new Error('Failed to fetch'))).toBe(false)
  })

  it('handles an error with no message property without throwing', () => {
    expect(isChunkLoadError({})).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})
