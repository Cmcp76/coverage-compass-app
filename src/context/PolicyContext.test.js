import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACTIVE_HISTORY_ID_KEY,
  ANALYSIS_KEY,
  HISTORY_KEY,
  defaultAnalysis,
  loadActiveHistoryId,
  loadAnalysis,
  loadHistory,
  saveActiveHistoryId,
  saveAnalysis,
  saveHistory,
} from './PolicyContext.jsx'

// vitest's default environment has no `localStorage` global, and every
// loader in this module wraps localStorage access in try/catch so it falls
// back to a safe default on ANY error, including a missing global. Without a
// real localStorage to write into, every test would just silently hit that
// catch branch, so this stands in a minimal in-memory implementation, real
// enough to actually exercise the shape-validation logic being tested.
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

describe('loadAnalysis', () => {
  it('returns defaultAnalysis when nothing is stored', () => {
    expect(loadAnalysis()).toEqual(defaultAnalysis)
  })

  it('returns a previously saved analysis', () => {
    const analysis = { ...defaultAnalysis, fileName: 'my-policy.pdf' }
    saveAnalysis(analysis)
    expect(loadAnalysis()).toEqual(analysis)
  })

  it('falls back to defaultAnalysis when the stored value is valid JSON but the wrong shape (null)', () => {
    // Regression: "null" is valid JSON, so a naive `raw ? JSON.parse(raw) :
    // fallback` treats it as present and returns null instead of falling
    // back, crashing every downstream page that reads analysis.<field>.
    localStorage.setItem(ANALYSIS_KEY, 'null')
    expect(loadAnalysis()).toEqual(defaultAnalysis)
  })

  it('falls back to defaultAnalysis when the stored value is an array instead of an object', () => {
    localStorage.setItem(ANALYSIS_KEY, '[1,2,3]')
    expect(loadAnalysis()).toEqual(defaultAnalysis)
  })

  it('falls back to defaultAnalysis when the stored value is malformed JSON', () => {
    localStorage.setItem(ANALYSIS_KEY, '{not valid json')
    expect(loadAnalysis()).toEqual(defaultAnalysis)
  })
})

describe('loadHistory', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadHistory()).toEqual([])
  })

  it('returns previously saved history entries', () => {
    const entries = [{ id: 'a', fileName: 'one.pdf' }]
    saveHistory(entries)
    expect(loadHistory()).toEqual(entries)
  })

  it('falls back to an empty array when the stored value is valid JSON but not an array', () => {
    localStorage.setItem(HISTORY_KEY, 'null')
    expect(loadHistory()).toEqual([])
  })

  it('falls back to an empty array when the stored value is an object instead of an array', () => {
    localStorage.setItem(HISTORY_KEY, '{"id":"a"}')
    expect(loadHistory()).toEqual([])
  })
})

describe('loadActiveHistoryId', () => {
  it('returns null when nothing is stored', () => {
    expect(loadActiveHistoryId()).toBeNull()
  })

  it('returns a previously saved id', () => {
    saveActiveHistoryId('entry-123')
    expect(loadActiveHistoryId()).toBe('entry-123')
  })

  it('removes the stored key when saved with a falsy id', () => {
    saveActiveHistoryId('entry-123')
    saveActiveHistoryId(null)
    expect(loadActiveHistoryId()).toBeNull()
    expect(localStorage.getItem(ACTIVE_HISTORY_ID_KEY)).toBeNull()
  })
})
