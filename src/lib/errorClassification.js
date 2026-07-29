// Dynamic import() rejection messages differ by browser, but all contain
// some form of "module" or "chunk" plus "fetch/load/import" language, this
// catches the common real-world trigger for a lazy-loaded route: a new
// deploy replaced this route's content-hashed chunk while a user still had
// the old app shell open, so the browser 404s fetching the stale URL.
export function isChunkLoadError(error) {
  const message = String(error?.message || '')
  return /module|chunk/i.test(message) && /fetch|load|import/i.test(message)
}
