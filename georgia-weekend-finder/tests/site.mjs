import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { LISTING_PAGES, CITY_PAGES, CATEGORY_PAGES } from '../assets/sections.js'
import { CITIES, matchCity } from '../assets/taxonomy.js'
import { eventSlug, isDateNight, filterEvents, eventJsonLd } from '../assets/render.js'
import { reviewEvent, findNearDuplicates, healthCheck } from '../scripts/lib/review.mjs'
import { normalizeEvent } from '../scripts/lib/normalize.mjs'
import { build, MIN_EVENTS_TO_INDEX } from '../scripts/build-site.mjs'

const NOW = new Date('2026-10-08T16:00:00Z') // Thursday noon ET

// Sample data for tests only. Never published.
function ev(id, title, start, extra = {}) {
  return {
    id, title, start, end: null, allDay: false, venue: 'Test Venue', address: '1 Test St', city: 'Decatur',
    category: 'live-music', price: { isFree: true, min: 0, max: 0, text: 'Free' }, url: `https://example.org/${id}`,
    ticketUrl: '', image: '', description: 'Test description', featured: false, sponsored: false,
    source: { id: 'test', name: 'Test Feed', url: 'https://example.org' }, ...extra,
  }
}
const SAMPLE = [
  ev('a1', 'Jazz on the Square', '2026-10-09T23:00:00.000Z'),
  ev('a2', 'Kids Storytime', '2026-10-10T14:00:00.000Z', { category: 'family' }),
  ev('a3', 'Comedy Night', '2026-10-11T00:00:00.000Z', { category: 'comedy-nightlife', price: { isFree: false, min: 15, max: 15, text: '$15' } }),
  ev('a4', 'Farmers Market', '2026-10-10T12:00:00.000Z', { category: 'festivals-markets', city: 'Atlanta' }),
  ev('a5', 'Next Week Concert', '2026-10-15T23:30:00.000Z', { featured: true }),
]

test('launch cities are active and have pages; expansion cities do not yet', () => {
  for (const name of ['Atlanta', 'Decatur', 'Stone Mountain', 'Marietta', 'Sandy Springs', 'Tucker', 'Lithonia', 'Clarkston', 'Brookhaven', 'East Point', 'College Park']) {
    const c = CITIES.find((x) => x.name === name)
    assert.ok(c?.active && c.launch, name)
    assert.ok(CITY_PAGES.some((p) => p.path === `/${c.slug}/`), `${name} page`)
    assert.ok(CITY_PAGES.some((p) => p.path === `/${c.slug}/free/`), `${name} free page`)
  }
  for (const name of ['Savannah', 'Augusta', 'Macon', 'Columbus', 'Athens']) {
    assert.equal(CITIES.find((x) => x.name === name).active, false, name)
    assert.ok(!CITY_PAGES.some((p) => p.city.name === name))
  }
  assert.equal(matchCity('Arabia Mountain Trailhead'), 'Lithonia')
})

test('every listing page has a unique path and SEO basics', () => {
  const paths = LISTING_PAGES.map((p) => p.path)
  assert.equal(new Set(paths).size, paths.length)
  for (const p of LISTING_PAGES) {
    assert.match(p.path, /^\/([a-z0-9-]+\/)*$/)
    assert.ok(p.title && p.description && p.h1, p.key)
  }
  assert.ok(CATEGORY_PAGES.find((p) => p.path === '/festivals-community-events/').preset.cats.includes('community'))
})

test('events from inactive (not yet covered) cities are skipped', () => {
  const src = { id: 's', name: 'S' }
  assert.equal(normalizeEvent({ title: 'Savannah Music Fest', start: new Date(), location: 'Forsyth Park, Savannah, GA' }, src), null)
  assert.ok(normalizeEvent({ title: 'Tucker Fest', start: new Date(), location: 'Main St, Tucker, GA' }, src))
})

test('descriptive event slugs', () => {
  assert.equal(eventSlug(SAMPLE[0]), '2026-10-09-jazz-on-the-square-decatur-a1')
})

test('date night picks evening adult categories only', () => {
  assert.equal(isDateNight(SAMPLE[0]), true) // 7 PM music
  assert.equal(isDateNight(SAMPLE[1]), false) // family
  assert.equal(isDateNight(SAMPLE[3]), false) // morning market
})

test('section filters: today, weekend, free, city', () => {
  assert.deepEqual(filterEvents(SAMPLE, { when: 'weekend' }, NOW).results.map((e) => e.id), ['a1', 'a4', 'a2', 'a3'])
  assert.equal(filterEvents(SAMPLE, { when: 'today' }, NOW).results.length, 0)
  assert.deepEqual(filterEvents(SAMPLE, { when: 'month', price: 'free', city: 'Atlanta' }, NOW).results.map((e) => e.id), ['a4'])
})

test('event JSON-LD includes price, place and canonical url', () => {
  const j = eventJsonLd(SAMPLE[2], 'https://site.test')
  assert.equal(j['@type'], 'Event')
  assert.equal(j.offers.price, 15)
  assert.equal(j.location.address.addressLocality, 'Decatur')
  assert.match(j.url, /^https:\/\/site\.test\/event\/2026-10-10-comedy-night/)
})

test('review: holds cancelled / location-less events, flags unknowns', () => {
  assert.ok(reviewEvent(ev('x', 'CANCELLED: Fall Fest', SAMPLE[0].start)).hold.length)
  assert.ok(reviewEvent(ev('x', 'Fall Fest', SAMPLE[0].start, { venue: '', address: '' })).hold.length)
  const r = reviewEvent(ev('x', 'Fall Fest', SAMPLE[0].start, { price: { isFree: null }, city: 'Other Georgia' }))
  assert.equal(r.hold.length, 0)
  assert.equal(r.flags.length, 2)
  const dups = findNearDuplicates([ev('1', 'Decatur Jazz Night Live', SAMPLE[0].start), ev('2', 'Jazz Night Live - Decatur', SAMPLE[0].start)])
  assert.equal(dups.length, 1)
})

test('health check blocks a sudden collapse in events', () => {
  assert.ok(healthCheck(100, 10))
  assert.equal(healthCheck(100, 60), null)
  assert.equal(healthCheck(5, 0), null) // too small to judge
})

test('site build: pages, event pages, sitemap, noindex for thin pages', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'gwf-'))
  const eventsFile = path.join(dir, 'events.json')
  await writeFile(eventsFile, JSON.stringify({ generatedAt: NOW.toISOString(), events: SAMPLE }))
  const out = path.join(dir, 'dist')
  await build({ outDir: out, eventsFile, now: NOW })
  const read = (p) => readFile(path.join(out, p), 'utf8')
  for (const p of ['index.html', 'today/index.html', 'this-weekend/index.html', 'free/index.html', 'date-night/index.html', 'calendar/index.html',
    'concerts-live-music/index.html', 'stone-mountain/index.html', 'decatur/free/index.html', 'submit/index.html', 'advertise/index.html',
    'terms/index.html', 'privacy/index.html', 'cities/index.html', '404.html', 'robots.txt', 'data/events.json', 'assets/app.js']) {
    await access(path.join(out, p))
  }
  const weekend = await read('this-weekend/index.html')
  assert.match(weekend, /Jazz on the Square/) // pre-rendered for search engines
  assert.match(weekend, /<link rel="canonical" href="[^"]+\/this-weekend\/">/)
  const decatur = await read('decatur/index.html')
  assert.doesNotMatch(decatur, /noindex/) // 4 Decatur events >= threshold
  const lithonia = await read('lithonia/index.html')
  assert.match(lithonia, /noindex/) // 0 events
  assert.ok(MIN_EVENTS_TO_INDEX > 0)
  const eventHtml = await read('event/2026-10-09-jazz-on-the-square-decatur-a1/index.html')
  assert.match(eventHtml, /"@type":"Event"/)
  assert.match(eventHtml, /Official event page/)
  const sitemap = await read('sitemap.xml')
  assert.match(sitemap, /\/event\/2026-10-09-jazz-on-the-square-decatur-a1\//)
  assert.match(sitemap, /\/decatur\//)
  assert.doesNotMatch(sitemap, /\/lithonia\//)
  const home = await read('index.html')
  assert.match(home, /Featured/) // featured strip shows the featured event
  const advertise = await read('advertise/index.html')
  assert.match(advertise, /labeled/)
  assert.match(advertise, /data-netlify="true"/)
})
