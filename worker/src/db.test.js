import { describe, it, expect, vi } from 'vitest'
import {
  createUser,
  findUserByEmail,
  createSession,
  findSessionUser,
  deleteSessionByTokenHash,
  saveAnalysis,
  listAnalyses,
  deleteOldestAnalysesBeyondLimit,
  getAnalysisById,
  deleteAnalysisById,
} from './db.js'

// A fake D1Database that records what SQL/params each call used and
// returns pre-configured results - verifies these thin wrappers build the
// right query and pass the right bindings, without needing a real SQLite
// engine in the test. Actual SQL correctness is additionally verified live
// against a real (Miniflare-simulated, then real) D1 instance.
function makeFakeDb({ firstResult = null, allResult = { results: [] }, runResult = { meta: { changes: 1 } } } = {}) {
  const calls = []
  const statement = {
    bind: vi.fn((...params) => {
      calls[calls.length - 1].params = params
      return statement
    }),
    first: vi.fn(async () => firstResult),
    all: vi.fn(async () => allResult),
    run: vi.fn(async () => runResult),
  }
  const db = {
    prepare: vi.fn((sql) => {
      calls.push({ sql, params: undefined })
      return statement
    }),
  }
  return { db, calls, statement }
}

describe('createUser', () => {
  it('inserts with the expected columns and params', async () => {
    const { db, calls } = makeFakeDb()
    await createUser(db, { id: 'u1', email: 'a@b.com', passwordHash: 'hash', fullName: 'A B', createdAt: '2026-01-01' })
    expect(calls[0].sql).toMatch(/INSERT INTO users/)
    expect(calls[0].params).toEqual(['u1', 'a@b.com', 'hash', 'A B', '2026-01-01'])
  })

  it('stores null for a missing full name rather than undefined', async () => {
    const { db, calls } = makeFakeDb()
    await createUser(db, { id: 'u1', email: 'a@b.com', passwordHash: 'hash', createdAt: '2026-01-01' })
    expect(calls[0].params[3]).toBeNull()
  })
})

describe('findUserByEmail', () => {
  it('queries by email and returns the row', async () => {
    const { db, calls } = makeFakeDb({ firstResult: { id: 'u1', email: 'a@b.com' } })
    const user = await findUserByEmail(db, 'a@b.com')
    expect(calls[0].sql).toMatch(/SELECT \* FROM users WHERE email/)
    expect(calls[0].params).toEqual(['a@b.com'])
    expect(user).toEqual({ id: 'u1', email: 'a@b.com' })
  })
})

describe('sessions', () => {
  it('createSession inserts the session row', async () => {
    const { db, calls } = makeFakeDb()
    await createSession(db, { id: 's1', userId: 'u1', tokenHash: 'th', createdAt: 'c', expiresAt: 'e' })
    expect(calls[0].sql).toMatch(/INSERT INTO sessions/)
    expect(calls[0].params).toEqual(['s1', 'u1', 'th', 'c', 'e'])
  })

  it('findSessionUser joins users and filters unexpired sessions by token hash', async () => {
    const { db, calls } = makeFakeDb({ firstResult: { id: 'u1' } })
    const user = await findSessionUser(db, 'th')
    expect(calls[0].sql).toMatch(/JOIN users/)
    expect(calls[0].params[0]).toBe('th')
    expect(user).toEqual({ id: 'u1' })
  })

  it('deleteSessionByTokenHash deletes by hash', async () => {
    const { db, calls } = makeFakeDb()
    await deleteSessionByTokenHash(db, 'th')
    expect(calls[0].sql).toMatch(/DELETE FROM sessions WHERE token_hash/)
    expect(calls[0].params).toEqual(['th'])
  })
})

describe('saved analyses', () => {
  it('saveAnalysis inserts with defaults for missing optional fields', async () => {
    const { db, calls } = makeFakeDb()
    await saveAnalysis(db, { id: 'a1', userId: 'u1', analysisJson: '{}', analyzedAt: 'x', createdAt: 'y' })
    expect(calls[0].sql).toMatch(/INSERT INTO saved_analyses/)
    expect(calls[0].params).toEqual(['a1', 'u1', null, null, null, '{}', 'x', 'y'])
  })

  it('listAnalyses returns the results array, defaulting to empty', async () => {
    const { db } = makeFakeDb({ allResult: { results: [{ id: 'a1' }] } })
    const rows = await listAnalyses(db, 'u1')
    expect(rows).toEqual([{ id: 'a1' }])
  })

  it('listAnalyses defaults to an empty array when results is missing', async () => {
    const { db } = makeFakeDb({ allResult: {} })
    const rows = await listAnalyses(db, 'u1')
    expect(rows).toEqual([])
  })

  it('deleteOldestAnalysesBeyondLimit scopes the delete to the user and offsets by the limit', async () => {
    const { db, calls } = makeFakeDb()
    await deleteOldestAnalysesBeyondLimit(db, 'u1', 10)
    expect(calls[0].sql).toMatch(/DELETE FROM saved_analyses/)
    expect(calls[0].params).toEqual(['u1', 10])
  })

  it('getAnalysisById scopes the lookup to the owning user', async () => {
    const { db, calls } = makeFakeDb({ firstResult: { id: 'a1' } })
    const row = await getAnalysisById(db, 'u1', 'a1')
    expect(calls[0].params).toEqual(['a1', 'u1'])
    expect(row).toEqual({ id: 'a1' })
  })

  it('deleteAnalysisById reports whether a row was actually deleted', async () => {
    const { db: dbHit } = makeFakeDb({ runResult: { meta: { changes: 1 } } })
    expect(await deleteAnalysisById(dbHit, 'u1', 'a1')).toBe(true)

    const { db: dbMiss } = makeFakeDb({ runResult: { meta: { changes: 0 } } })
    expect(await deleteAnalysisById(dbMiss, 'u1', 'a1')).toBe(false)
  })
})
