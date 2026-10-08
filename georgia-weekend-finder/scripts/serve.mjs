#!/usr/bin/env node
// Tiny static server for local preview of dist/: npm start -> http://localhost:8080
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 8080
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = path.join(ROOT, urlPath)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    const notFound = await readFile(path.join(ROOT, '404.html')).catch(() => 'Not found')
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(notFound)
  }
}).listen(PORT, () => console.log(`Georgia Weekend Finder running at http://localhost:${PORT}`))
