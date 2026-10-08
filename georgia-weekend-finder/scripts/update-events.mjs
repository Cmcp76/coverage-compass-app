#!/usr/bin/env node
// Daily updater: pulls events from APPROVED sources in data/sources.json,
// merges hand-curated events from data/manual-events.json, and writes
// data/events.json for the website.
//
//   node scripts/update-events.mjs            # fetch + write
//   node scripts/update-events.mjs --dry-run  # fetch + print summary only
//   node scripts/update-events.mjs --offline  # manual events only (no network)
//
// It never invents events: anything published comes from a source you have
// approved or from your own manual file.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { TIMEZONE } from '../assets/taxonomy.js'
import { startOfLocalDay } from '../assets/time.js'
import { ADAPTERS, redactKey } from './lib/adapters.mjs'
import { normalizeEvent, validateManualEvent, manualToRaw, dedupeKey } from './lib/normalize.mjs'
import { reviewEvent, findNearDuplicates, healthCheck } from './lib/review.mjs'
import { appendFile } from 'node:fs/promises'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const OFFLINE = args.has('--offline')
const FORCE = args.has('--force')

const LOOKAHEAD_DAYS = 90
const MAX_PER_SOURCE = 1500
const KEEP_STALE_DAYS = 3 // if a source is down, keep its last-good events this long

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(DATA, file), 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback
    throw new Error(`Could not read data/${file}: ${err.message}`)
  }
}

// A source runs only if it is enabled AND its permission is recorded as
// approved. This is the guard that keeps unpermitted scraping out.
export function sourceIsRunnable(s) {
  if (!s.enabled) return { ok: false, reason: 'disabled' }
  if (!ADAPTERS[s.type]) return { ok: false, reason: `unknown type "${s.type}"` }
  const p = s.permission || {}
  if (p.status !== 'approved') return { ok: false, reason: 'permission not approved' }
  if (!p.basis || !p.verifiedOn) return { ok: false, reason: 'permission.basis and permission.verifiedOn are required' }
  if (s.type !== 'ticketmaster' && !s.url) return { ok: false, reason: 'missing url' }
  return { ok: true }
}

async function main() {
  const now = new Date()
  const windowStart = startOfLocalDay(now, TIMEZONE)
  const windowEnd = startOfLocalDay(now, TIMEZONE, LOOKAHEAD_DAYS)
  const ctx = { tz: TIMEZONE, windowStart, windowEnd }

  const sourcesFile = await readJson('sources.json')
  const manual = await readJson('manual-events.json', { events: [], suppress: [] })
  const previous = await readJson('events.json', { events: [], sources: [] })

  // 1. Validate manual events first: a typo should fail loudly, not publish.
  const manualEvents = manual.events || []
  const errors = manualEvents.filter((e) => !e.hidden).flatMap(validateManualEvent)
  if (errors.length) {
    console.error('Fix these problems in data/manual-events.json:\n  ' + errors.join('\n  '))
    process.exit(1)
  }

  const collected = []
  const report = []

  // 2. Approved automated sources.
  for (const source of sourcesFile.sources || []) {
    const check = sourceIsRunnable(source)
    if (!check.ok) {
      report.push({ id: source.id, name: source.name, status: 'skipped', reason: check.reason, count: 0 })
      continue
    }
    if (OFFLINE) {
      report.push({ id: source.id, name: source.name, status: 'skipped', reason: 'offline mode', count: 0 })
      continue
    }
    try {
      const raw = await ADAPTERS[source.type](source, ctx)
      const events = raw.map((r) => normalizeEvent(r, source)).filter(Boolean).slice(0, MAX_PER_SOURCE)
      collected.push(...events)
      report.push({ id: source.id, name: source.name, website: source.website || '', status: 'ok', count: events.length, fetchedAt: now.toISOString() })
      console.log(`✓ ${source.name}: ${events.length} events`)
    } catch (err) {
      const prevReport = (previous.sources || []).find((r) => r.id === source.id && r.fetchedAt)
      const fresh = prevReport && now - new Date(prevReport.fetchedAt) < KEEP_STALE_DAYS * 86400000
      const kept = fresh ? (previous.events || []).filter((e) => e.source?.id === source.id) : []
      collected.push(...kept)
      report.push({
        id: source.id, name: source.name, website: source.website || '', status: 'error',
        error: redactKey(err.message), count: kept.length, fetchedAt: fresh ? prevReport.fetchedAt : undefined,
      })
      console.warn(`✗ ${source.name}: ${redactKey(err.message)}${kept.length ? ` (kept ${kept.length} events from last good run)` : ''}`)
    }
  }

  // 3. Manual curation (wins over feed duplicates).
  const manualSource = { id: 'manual', name: sourcesFile.manualSourceName || 'Georgia Weekend Finder', website: '' }
  const curated = manualEvents.filter((e) => !e.hidden).map((e) => normalizeEvent(manualToRaw(e), manualSource)).filter(Boolean)
  report.push({ id: 'manual', name: manualSource.name, status: 'ok', count: curated.length })

  // 4. Window, suppress list, de-duplication.
  const suppress = new Set((manual.suppress || []).map(String))
  const inWindow = (e) => new Date(e.end || e.start) >= windowStart && new Date(e.start) <= windowEnd
  const byKey = new Map()
  for (const ev of [...curated, ...collected]) {
    if (!inWindow(ev) || suppress.has(ev.id) || suppress.has(ev.url)) continue
    const key = dedupeKey(ev)
    if (!byKey.has(key)) byKey.set(key, ev)
  }
  const all = [...byKey.values()].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title))

  // 5. Human review: hold questionable feed events until approved, flag the rest.
  //    Manual events were curated by you, so they are never held.
  const approved = new Set((manual.approve || []).map(String))
  const events = []
  const held = []
  const flagged = []
  for (const ev of all) {
    if (ev.source.id === 'manual') { events.push(ev); continue }
    const r = reviewEvent(ev)
    const item = { id: ev.id, title: ev.title, start: ev.start, city: ev.city, source: ev.source.name, url: ev.url }
    if (r.hold.length && !approved.has(ev.id)) { held.push({ ...item, issues: r.hold }); continue }
    events.push(ev)
    if (r.flags.length) flagged.push({ ...item, issues: r.flags })
  }
  for (const [a, b] of findNearDuplicates(events)) {
    flagged.push({ id: b.id, title: b.title, start: b.start, city: b.city, source: b.source.name, url: b.url, issues: [`Possible duplicate of "${a.title}" (${a.source.name}). Add one id to "suppress" if so.`] })
  }

  const output = {
    generatedAt: now.toISOString(),
    timezone: TIMEZONE,
    window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
    sources: report,
    events,
  }

  const free = events.filter((e) => e.price.isFree === true).length
  console.log(`\n${events.length} events (${free} free) from ${report.filter((r) => r.count > 0).length} source(s). ${held.length} held for review, ${flagged.length} flagged.`)
  await writeSummary({ events, free, report, held, flagged })

  const problem = healthCheck((previous.events || []).length, events.length)
  if (problem && !FORCE) {
    console.error(problem)
    process.exit(1)
  }
  if (DRY_RUN) {
    console.log('Dry run: nothing written.')
    for (const h of held) console.log(`  HOLD ${h.title} (${h.id}): ${h.issues.join('; ')}`)
    return
  }
  await writeFile(path.join(DATA, 'events.json'), JSON.stringify(output, null, 2) + '\n')
  await writeFile(path.join(DATA, 'review-queue.json'), JSON.stringify({
    _readme: 'Generated daily. HELD events are not published: if one is fine, add its id to "approve" in manual-events.json. FLAGGED events are published; fix or hide them with "suppress" if needed.',
    generatedAt: now.toISOString(), held, flagged,
  }, null, 2) + '\n')
  console.log('Wrote data/events.json and data/review-queue.json')
}

// A readable report on the GitHub Actions run page.
async function writeSummary({ events, free, report, held, flagged }) {
  const file = process.env.GITHUB_STEP_SUMMARY
  if (!file) return
  const row = (cells) => `| ${cells.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ')} |`
  const lines = [
    '## Georgia Weekend Finder update',
    `**${events.length} events published** (${free} free) · **${held.length} held for review** · ${flagged.length} flagged`,
    '', '### Sources', row(['Source', 'Status', 'Events', 'Note']), row(['---', '---', '---', '---']),
    ...report.map((r) => row([r.name, r.status, r.count, r.error || r.reason || ''])),
  ]
  if (held.length) {
    lines.push('', '### Held (not published, needs your OK)', row(['Event', 'Date', 'Source', 'Why', 'id']), row(['---', '---', '---', '---', '---']),
      ...held.map((h) => row([h.title, h.start.slice(0, 10), h.source, h.issues.join('; '), h.id])))
  }
  if (flagged.length) {
    lines.push('', `### Flagged (published, worth a glance): ${flagged.length}`, row(['Event', 'Date', 'Why']), row(['---', '---', '---']),
      ...flagged.slice(0, 50).map((f) => row([f.title, f.start.slice(0, 10), f.issues.join('; ')])))
  }
  await appendFile(file, lines.join('\n') + '\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
