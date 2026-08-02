-- Coverage Compass D1 schema: real accounts + server-side saved reviews.
-- Apply with: npx wrangler d1 execute coverage-compass-db --remote --file=schema.sql
-- (drop --remote for local dev against the Miniflare-simulated D1 instead)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TEXT NOT NULL
);

-- Bearer-token sessions rather than cookies: the frontend (GitHub Pages)
-- and this Worker (workers.dev) are different origins, and cross-origin
-- cookies mean SameSite=None + Secure plus extra CORS credential wiring on
-- every request. A token in an Authorization header sidesteps all of that.
-- Only the SHA-256 hash of the token is stored, mirroring the password
-- hashing approach - a leaked database row shouldn't hand out a working
-- session, the same way it shouldn't hand out a working password.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- One row per saved policy review for a logged-in user - the server-side
-- equivalent of PolicyContext.jsx's localStorage history, except this one
-- follows the account across devices/browsers instead of staying local to
-- one. analysis_json stores the full analysis object (same shape
-- analyzeText()/mapClaudeResultToAnalysis() already produce) so the
-- frontend doesn't need a different rendering path for a synced vs. local
-- review.
CREATE TABLE IF NOT EXISTS saved_analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT,
  detected_policy_type TEXT,
  coverage_score INTEGER,
  analysis_json TEXT NOT NULL,
  analyzed_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_id ON saved_analyses(user_id);
