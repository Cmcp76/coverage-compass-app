import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSaveAnalysis, handleListAnalyses, handleGetAnalysis, handleDeleteAnalysis } from './analysesRoutes.js'
import * as db from './db.js'

vi.mock('./db.js')

function makeRequest(body) {
  return new Request('https://example.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const env = { DB: {} }
const user = { id: 'u1', email: 'a@b.com' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleSaveAnalysis', () => {
  it('rejects a request with no analysis object', async () => {
    const result = await handleSaveAnalysis(makeRequest({}), env, user)
    expect(result.status).toBe(400)
    expect(db.saveAnalysis).not.toHaveBeenCalled()
  })

  it('saves the analysis scoped to the authenticated user and enforces the history cap', async () => {
    const result = await handleSaveAnalysis(
      makeRequest({ analysis: { fileName: 'policy.pdf', detectedPolicyType: 'Auto', coverageScore: 80, analyzedAt: '2026-01-01' } }),
      env,
      user,
    )
    expect(result.status).toBe(201)
    expect(result.body.id).toEqual(expect.any(String))
    expect(db.saveAnalysis).toHaveBeenCalledWith(
      env.DB,
      expect.objectContaining({ userId: 'u1', fileName: 'policy.pdf', detectedPolicyType: 'Auto', coverageScore: 80 }),
    )
    expect(db.deleteOldestAnalysesBeyondLimit).toHaveBeenCalledWith(env.DB, 'u1', 10)
  })

  it('stores JSON-serialized analysis exactly reproducible on read-back', async () => {
    const analysis = { detectedPolicyType: 'Homeowners', coverages: [{ name: 'Dwelling' }] }
    await handleSaveAnalysis(makeRequest({ analysis }), env, user)
    const call = db.saveAnalysis.mock.calls[0][1]
    expect(JSON.parse(call.analysisJson)).toEqual(analysis)
  })

  it('defaults missing optional fields to null rather than throwing', async () => {
    await handleSaveAnalysis(makeRequest({ analysis: {} }), env, user)
    const call = db.saveAnalysis.mock.calls[0][1]
    expect(call.fileName).toBeNull()
    expect(call.detectedPolicyType).toBeNull()
    expect(call.coverageScore).toBeNull()
  })
})

describe('handleListAnalyses', () => {
  it('maps DB rows to the camelCase API shape', async () => {
    db.listAnalyses.mockResolvedValue([
      { id: 'a1', file_name: 'x.pdf', detected_policy_type: 'Auto', coverage_score: 90, analyzed_at: '2026-01-01' },
    ])
    const result = await handleListAnalyses(makeRequest(undefined), env, user)
    expect(result.status).toBe(200)
    expect(result.body.analyses).toEqual([
      { id: 'a1', fileName: 'x.pdf', detectedPolicyType: 'Auto', coverageScore: 90, analyzedAt: '2026-01-01' },
    ])
    expect(db.listAnalyses).toHaveBeenCalledWith(env.DB, 'u1', 10)
  })
})

describe('handleGetAnalysis', () => {
  it('returns 404 when the analysis does not exist or belongs to another user', async () => {
    db.getAnalysisById.mockResolvedValue(null)
    const result = await handleGetAnalysis(env, user, 'missing-id')
    expect(result.status).toBe(404)
  })

  it('parses and returns the stored analysis JSON', async () => {
    db.getAnalysisById.mockResolvedValue({ analysis_json: JSON.stringify({ coverageScore: 77 }) })
    const result = await handleGetAnalysis(env, user, 'a1')
    expect(result.status).toBe(200)
    expect(result.body.analysis).toEqual({ coverageScore: 77 })
  })

  it('returns 500 rather than throwing on corrupted stored JSON', async () => {
    db.getAnalysisById.mockResolvedValue({ analysis_json: '{not valid json' })
    const result = await handleGetAnalysis(env, user, 'a1')
    expect(result.status).toBe(500)
  })
})

describe('handleDeleteAnalysis', () => {
  it('returns 404 when nothing was deleted', async () => {
    db.deleteAnalysisById.mockResolvedValue(false)
    const result = await handleDeleteAnalysis(env, user, 'a1')
    expect(result.status).toBe(404)
  })

  it('returns success when a row was deleted', async () => {
    db.deleteAnalysisById.mockResolvedValue(true)
    const result = await handleDeleteAnalysis(env, user, 'a1')
    expect(result.status).toBe(200)
    expect(result.body.success).toBe(true)
  })
})
