// Thin D1 query helpers. `db` is always env.DB (see wrangler.toml's
// d1_databases binding) - kept as a plain parameter rather than imported
// as a singleton so these are easy to call with a fake/mock db in tests.

export async function createUser(db, { id, email, passwordHash, fullName, createdAt }) {
  await db
    .prepare('INSERT INTO users (id, email, password_hash, full_name, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, email, passwordHash, fullName || null, createdAt)
    .run()
}

export async function findUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
}

export async function findUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
}

export async function createSession(db, { id, userId, tokenHash, createdAt, expiresAt }) {
  await db
    .prepare('INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, userId, tokenHash, createdAt, expiresAt)
    .run()
}

// Joins to the user row in one query rather than two round trips - this
// runs on every authenticated request, so it's worth not paying for a
// second D1 query every time.
export async function findSessionUser(db, tokenHash) {
  return db
    .prepare(
      `SELECT users.* FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first()
}

export async function deleteSessionByTokenHash(db, tokenHash) {
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()
}

export async function saveAnalysis(db, { id, userId, fileName, detectedPolicyType, coverageScore, analysisJson, analyzedAt, createdAt }) {
  await db
    .prepare(
      `INSERT INTO saved_analyses (id, user_id, file_name, detected_policy_type, coverage_score, analysis_json, analyzed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, userId, fileName || null, detectedPolicyType || null, coverageScore ?? null, analysisJson, analyzedAt, createdAt)
    .run()
}

// Newest first, capped - mirrors PolicyContext.jsx's MAX_HISTORY=10 cap on
// the localStorage version, so a person doesn't see a different history
// depth depending on whether they're logged in.
export async function listAnalyses(db, userId, limit = 10) {
  const result = await db
    .prepare(
      `SELECT id, file_name, detected_policy_type, coverage_score, analyzed_at, created_at
       FROM saved_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .bind(userId, limit)
    .all()
  return result.results || []
}

export async function countAnalyses(db, userId) {
  const row = await db.prepare('SELECT COUNT(*) as count FROM saved_analyses WHERE user_id = ?').bind(userId).first()
  return row?.count ?? 0
}

// Used to enforce the MAX_HISTORY cap: delete the oldest rows beyond the
// limit after inserting a new one, same FIFO behavior as the client-side
// history's `.slice(0, MAX_HISTORY)`.
export async function deleteOldestAnalysesBeyondLimit(db, userId, limit) {
  await db
    .prepare(
      `DELETE FROM saved_analyses WHERE id IN (
         SELECT id FROM saved_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET ?
       )`,
    )
    .bind(userId, limit)
    .run()
}

export async function getAnalysisById(db, userId, id) {
  return db.prepare('SELECT * FROM saved_analyses WHERE id = ? AND user_id = ?').bind(id, userId).first()
}

export async function deleteAnalysisById(db, userId, id) {
  const result = await db.prepare('DELETE FROM saved_analyses WHERE id = ? AND user_id = ?').bind(id, userId).run()
  return result.meta?.changes > 0
}
