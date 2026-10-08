#!/usr/bin/env node
// Builds the public website into dist/: one real HTML page per section,
// category, city and event (search engines see full content without
// running JavaScript), plus sitemap.xml and robots.txt.
//
//   node scripts/build-site.mjs                       # -> dist/
//   node scripts/build-site.mjs --out /tmp/site --events some.json --now 2026-10-08T16:00:00Z
import { readFile, writeFile, mkdir, rm, cp, access } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { SITE } from '../assets/config.js'
import { TIMEZONE, ACTIVE_CITIES } from '../assets/taxonomy.js'
import { localDateKey } from '../assets/time.js'
import { LISTING_PAGES, HOME_PAGE, CALENDAR_PAGE, CORE_SECTIONS } from '../assets/sections.js'
import { filterEvents, listHtml, emptyHtml, effectiveEnd, eventPath, DATE_PRESETS } from '../assets/render.js'
import * as T from './lib/templates.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const MIN_EVENTS_TO_INDEX = 3 // thinner city/category pages get noindex
const ALWAYS_INDEX = new Set([HOME_PAGE.key, CALENDAR_PAGE.key, ...CORE_SECTIONS.map((p) => p.key)])

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : fallback
}

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

async function writePage(outDir, urlPath, html) {
  const file = urlPath.endsWith('.html') ? path.join(outDir, urlPath) : path.join(outDir, urlPath, 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

export async function build({ outDir, eventsFile, now = new Date() }) {
  const data = JSON.parse(await readFile(eventsFile, 'utf8'))
  const events = (data.events || []).filter((e) => effectiveEnd(e) >= now)
  const siteUrl = SITE.url.replace(/\/$/, '')

  await rm(outDir, { recursive: true, force: true })
  await mkdir(path.join(outDir, 'data'), { recursive: true })
  await cp(path.join(ROOT, 'assets'), path.join(outDir, 'assets'), { recursive: true })
  await writeFile(path.join(outDir, 'data', 'events.json'), JSON.stringify({ ...data, events }))
  for (const f of ['data/local-ads.json', 'ads.txt']) {
    if (await exists(path.join(ROOT, f))) await cp(path.join(ROOT, f), path.join(outDir, f))
  }

  const sitemap = []
  const lastmod = localDateKey(now, TIMEZONE)
  const counts = {}
  const pageResults = {}
  for (const page of LISTING_PAGES) {
    const { range, results } = filterEvents(events, page.preset, now)
    counts[page.key] = results.length
    pageResults[page.key] = { range, results }
  }

  // Listing pages
  for (const page of LISTING_PAGES) {
    const { range, results } = pageResults[page.key]
    const noindex = !ALWAYS_INDEX.has(page.key) && results.length < MIN_EVENTS_TO_INDEX
    const preset = DATE_PRESETS.find((d) => d.id === page.preset.when)
    const ctx = {
      count: results.length,
      heading: page.key === 'home' ? 'This weekend' : preset ? preset.title : 'Upcoming events',
      listHtml: results.length ? listHtml(results, range, now) : '',
      emptyHtml: emptyHtml({ hasAny: events.length > 0 }),
      jsonld: [],
      noindex,
    }
    let html
    if (page.key === 'home') {
      const featured = events.filter((e) => (e.featured || e.sponsored) && filterEvents([e], { when: 'month' }, now).results.length).slice(0, 6)
      html = T.homePage(page, { ...ctx, counts, featured })
    } else if (page.key === 'calendar') {
      html = T.calendarPage(page)
    } else {
      html = T.listingPage(page, ctx)
    }
    await writePage(outDir, page.path, html)
    if (!noindex) sitemap.push({ loc: `${siteUrl}${page.path}`, changefreq: 'daily', priority: page.key === 'home' ? '1.0' : '0.8' })
  }

  // Event pages
  const seen = new Set()
  const nextMonth = filterEvents(events, { when: 'month' }, now).results
  for (const e of events) {
    const p = eventPath(e)
    if (seen.has(p)) continue
    seen.add(p)
    const upcoming = nextMonth.filter((x) => x.id !== e.id)
    let related = upcoming.filter((x) => x.city === e.city).slice(0, 4)
    if (related.length < 2) related = upcoming.filter((x) => x.category === e.category).slice(0, 4)
    await writePage(outDir, p, T.eventPage(e, { related }))
    sitemap.push({ loc: `${siteUrl}${p}`, changefreq: 'weekly', priority: '0.6' })
  }

  // Other pages
  const cityCounts = Object.fromEntries(ACTIVE_CITIES.map((c) => [`city-${c.slug}`, counts[`city-${c.slug}`] || 0]))
  await writePage(outDir, '/cities/', T.citiesPage({ counts: cityCounts }))
  await writePage(outDir, '/submit/', T.submitPage())
  await writePage(outDir, '/advertise/', T.advertisePage())
  await writePage(outDir, '/privacy/', T.privacyPage())
  await writePage(outDir, '/terms/', T.termsPage())
  await writePage(outDir, '/thanks/', T.thanksPage())
  await writePage(outDir, '/404.html', T.notFoundPage())
  for (const p of ['/cities/', '/submit/', '/advertise/', '/privacy/', '/terms/']) {
    sitemap.push({ loc: `${siteUrl}${p}`, changefreq: 'monthly', priority: '0.4' })
  }

  await writeFile(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`)
  await writeFile(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /thanks/\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
  // Old single-page URLs -> new pages (Netlify / Cloudflare Pages format)
  await writeFile(path.join(outDir, '_redirects'), '/privacy.html /privacy/ 301\n/thanks.html /thanks/ 301\n/index.html / 301\n')

  return { pages: sitemap.length, events: events.length, counts }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = path.resolve(arg('out', path.join(ROOT, 'dist')))
  const eventsFile = path.resolve(arg('events', path.join(ROOT, 'data', 'events.json')))
  const now = arg('now') ? new Date(arg('now')) : new Date()
  build({ outDir, eventsFile, now })
    .then((r) => console.log(`Built ${r.pages} indexable pages (${r.events} events) into ${path.relative(process.cwd(), outDir) || '.'}`))
    .catch((err) => { console.error(err); process.exit(1) })
}

