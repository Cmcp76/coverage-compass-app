// Routes for a logged-in user's saved policy reviews - the server-side
// equivalent of PolicyContext.jsx's localStorage history, except this one
// follows the account across devices instead of staying local to one
// browser. All routes here require an authenticated user (see
// requireAuth in authRoutes.js); index.js's router enforces that before
// calling into these.

import { generateId } from './auth.js'
import { saveAnalysis, listAnalyses, deleteOldestAnalysesBeyondLimit, getAnalysisById, deleteAnalysisById } from './db.js'

// Mirrors PolicyContext.jsx's MAX_HISTORY - a person shouldn't see a
// different history depth depending on whether they're logged in.
const MAX_HISTORY = 10

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function handleSaveAnalysis(request, env, user) {
  const body = await readJsonBody(request)
  if (!body || typeof body.analysis !== 'object' || body.analysis === null) {
    return { status: 400, body: { error: 'Missing required "analysis" object.' } }
  }

  const id = generateId()
  const createdAt = new Date().toISOString()
  await saveAnalysis(env.DB, {
    id,
    userId: user.id,
    fileName: typeof body.analysis.fileName === 'string' ? body.analysis.fileName : null,
    detectedPolicyType: typeof body.analysis.detectedPolicyType === 'string' ? body.analysis.detectedPolicyType : null,
    coverageScore: Number.isFinite(body.analysis.coverageScore) ? body.analysis.coverageScore : null,
    analysisJson: JSON.stringify(body.analysis),
    analyzedAt: typeof body.analysis.analyzedAt === 'string' ? body.analysis.analyzedAt : createdAt,
    createdAt,
  })
  // FIFO cap: keep only the MAX_HISTORY most recent rows for this user,
  // matching the local history's `.slice(0, MAX_HISTORY)` behavior.
  await deleteOldestAnalysesBeyondLimit(env.DB, user.id, MAX_HISTORY)

  return { status: 201, body: { id } }
}

export async function handleListAnalyses(request, env, user) {
  const rows = await listAnalyses(env.DB, user.id, MAX_HISTORY)
  return {
    status: 200,
    body: {
      analyses: rows.map((row) => ({
        id: row.id,
        fileName: row.file_name,
        detectedPolicyType: row.detected_policy_type,
        coverageScore: row.coverage_score,
        analyzedAt: row.analyzed_at,
      })),
    },
  }
}

export async function handleGetAnalysis(env, user, id) {
  const row = await getAnalysisById(env.DB, user.id, id)
  if (!row) return { status: 404, body: { error: 'Not found.' } }
  let analysis
  try {
    analysis = JSON.parse(row.analysis_json)
  } catch {
    return { status: 500, body: { error: 'Stored analysis data is corrupted.' } }
  }
  return { status: 200, body: { analysis } }
}

export async function handleDeleteAnalysis(env, user, id) {
  const deleted = await deleteAnalysisById(env.DB, user.id, id)
  if (!deleted) return { status: 404, body: { error: 'Not found.' } }
  return { status: 200, body: { success: true } }
}
