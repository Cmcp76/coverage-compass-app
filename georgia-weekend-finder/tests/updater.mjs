import { test } from 'node:test'
import assert from 'node:assert/strict'
import { zonedToUtc, parseLooseDate, weekendRange, localDateKey, startOfLocalDay } from '../assets/time.js'
import { matchCity, inferCategory } from '../assets/taxonomy.js'
import { parseICS, icsToRawEvents, expandRRule, parseIcsDate } from '../scripts/lib/ics.mjs'
import { inferPrice, normalizePrice, normalizeEvent, validateManualEvent, manualToRaw, stripHtml } from '../scripts/lib/normalize.mjs'
import { extractJsonLdEvents, isAllowedByRobots, getPath } from '../scripts/lib/adapters.mjs'
import { sourceIsRunnable } from '../scripts/update-events.mjs'

const TZ = 'America/New_York'

test('zonedToUtc handles EDT, EST and DST edges', () => {
  assert.equal(zonedToUtc(2026, 10, 10, 19, 0, 0, TZ).toISOString(), '2026-10-10T23:00:00.000Z') // EDT -4
  assert.equal(zonedToUtc(2026, 12, 5, 19, 0, 0, TZ).toISOString(), '2026-12-06T00:00:00.000Z') // EST -5
  assert.equal(zonedToUtc(2026, 11, 1, 0, 0, 0, TZ).toISOString(), '2026-11-01T04:00:00.000Z') // DST ends that day
  assert.equal(zonedToUtc(2026, 11, 2, 0, 0, 0, TZ).toISOString(), '2026-11-02T05:00:00.000Z')
})

test('parseLooseDate formats', () => {
  assert.deepEqual(parseLooseDate('2026-10-10', TZ), { date: new Date('2026-10-10T04:00:00Z'), allDay: true })
  assert.equal(parseLooseDate('2026-10-10T19:30', TZ).date.toISOString(), '2026-10-10T23:30:00.000Z')
  assert.equal(parseLooseDate('2026-10-10T19:30:00-04:00', TZ).date.toISOString(), '2026-10-10T23:30:00.000Z')
  assert.equal(parseLooseDate('2026-10-10T23:30:00Z', TZ).date.toISOString(), '2026-10-10T23:30:00.000Z')
  assert.equal(parseLooseDate('next friday', TZ), null)
})

test('weekendRange from a Thursday, Saturday and Sunday', () => {
  const thu = new Date('2026-10-08T16:00:00Z')
  const r = weekendRange(thu, TZ)
  assert.equal(localDateKey(r.start, TZ), '2026-10-09')
  assert.equal(r.end.toISOString(), zonedToUtc(2026, 10, 12, 0, 0, 0, TZ).toISOString())
  const sat = weekendRange(new Date('2026-10-10T15:00:00Z'), TZ)
  assert.equal(localDateKey(sat.start, TZ), '2026-10-10')
  assert.equal(localDateKey(sat.end, TZ), '2026-10-12')
  const sun = weekendRange(new Date('2026-10-11T15:00:00Z'), TZ)
  assert.equal(localDateKey(sun.start, TZ), '2026-10-11')
  assert.equal(localDateKey(sun.end, TZ), '2026-10-12')
})

test('startOfLocalDay crosses DST correctly', () => {
  const d = startOfLocalDay(new Date('2026-10-31T16:00:00Z'), TZ, 2)
  assert.equal(d.toISOString(), '2026-11-02T05:00:00.000Z')
})

test('city matching prefers longest name and knows neighborhoods', () => {
  assert.equal(matchCity('Peachtree City Amphitheater, Peachtree City, GA'), 'Peachtree City')
  assert.equal(matchCity('Little Five Points Community Center'), 'Atlanta')
  assert.equal(matchCity('123 Main St, Decatur, GA 30030'), 'Decatur')
  assert.equal(matchCity('Somewhere, Ohio'), null)
})

test('category inference', () => {
  assert.equal(inferCategory('Friday Night Jazz Concert on the Square'), 'live-music')
  assert.equal(inferCategory('Saturday Farmers Market'), 'festivals-markets')
  assert.equal(inferCategory('Toddler Storytime at the Library'), 'family')
  assert.equal(inferCategory('Guided Nature Hike'), 'outdoor')
  assert.equal(inferCategory('Something vague', 'community'), 'community')
  assert.equal(inferCategory('A party for everyone'), 'comedy-nightlife') // "art" must not match "party"
})

test('price inference is conservative', () => {
  assert.equal(inferPrice('Free admission for all').isFree, true)
  assert.equal(inferPrice('Gluten-free snacks provided, free parking').isFree, null)
  assert.deepEqual(inferPrice('Tickets $15 - $25'), { isFree: false, min: 15, max: 25, text: '$15–$25' })
  assert.equal(normalizePrice('free').isFree, true)
  assert.equal(normalizePrice(0).isFree, true)
  assert.equal(normalizePrice({ min: 10, max: 10 }).text, '$10')
  assert.equal(normalizePrice('paid').isFree, false)
})

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/New_York
END:VTIMEZONE
BEGIN:VEVENT
UID:one@test
SUMMARY:Jazz in the Park\\, Free admission
DTSTART;TZID=America/New_York:20261010T190000
DTEND;TZID=America/New_York:20261010T210000
LOCATION:Glenlake Park\\, 1121 Church St\\, Decatur\\, GA
DESCRIPTION:Bring a blanket.\\nAll ages
  welcome.
URL:https://example.gov/jazz
BEGIN:VALARM
TRIGGER:-PT15M
SUMMARY:Alarm should be ignored
END:VALARM
END:VEVENT
BEGIN:VEVENT
UID:weekly@test
SUMMARY:Saturday Farmers Market
DTSTART;TZID=America/New_York:20261003T080000
DURATION:PT4H
RRULE:FREQ=WEEKLY;BYDAY=SA;COUNT=10
EXDATE;TZID=America/New_York:20261017T080000
END:VEVENT
BEGIN:VEVENT
UID:weekly@test
RECURRENCE-ID;TZID=America/New_York:20261024T080000
SUMMARY:Saturday Farmers Market (Harvest Edition)
DTSTART;TZID=America/New_York:20261024T090000
DTEND;TZID=America/New_York:20261024T140000
END:VEVENT
BEGIN:VEVENT
UID:cancelled@test
STATUS:CANCELLED
SUMMARY:Cancelled thing
DTSTART:20261010T150000Z
END:VEVENT
BEGIN:VEVENT
UID:allday@test
SUMMARY:Fall Festival
DTSTART;VALUE=DATE:20261011
DTEND;VALUE=DATE:20261012
END:VEVENT
END:VCALENDAR`

test('ICS parsing: escapes, folding, alarms ignored, cancelled dropped', () => {
  const evs = parseICS(ICS)
  assert.equal(evs.length, 5)
  const raw = icsToRawEvents(ICS, { defaultTz: TZ, windowStart: new Date('2026-10-08T04:00:00Z'), windowEnd: new Date('2026-11-30T05:00:00Z') })
  const jazz = raw.find((e) => e.uid === 'one@test')
  assert.equal(jazz.title, 'Jazz in the Park, Free admission')
  assert.equal(jazz.description, 'Bring a blanket.\nAll ages welcome.')
  assert.equal(jazz.start.toISOString(), '2026-10-10T23:00:00.000Z')
  assert.equal(jazz.end.toISOString(), '2026-10-11T01:00:00.000Z')
  assert.ok(!raw.some((e) => e.uid === 'cancelled@test'))
  const fest = raw.find((e) => e.uid === 'allday@test')
  assert.equal(fest.allDay, true)
})

test('ICS recurrence: window, EXDATE, RECURRENCE-ID override, DST', () => {
  const raw = icsToRawEvents(ICS, { defaultTz: TZ, windowStart: new Date('2026-10-08T04:00:00Z'), windowEnd: new Date('2026-11-30T05:00:00Z') })
  const market = raw.filter((e) => e.uid === 'weekly@test').map((e) => e.start.toISOString()).sort()
  // COUNT=10 from Oct 3 => through Dec 5; window starts Oct 8 and ends Nov 30.
  // Oct 17 excluded, Oct 24 replaced by the override (09:00).
  assert.deepEqual(market, [
    '2026-10-10T12:00:00.000Z',
    '2026-10-24T13:00:00.000Z', // override, 9am EDT
    '2026-10-31T12:00:00.000Z',
    '2026-11-07T13:00:00.000Z', // 8am EST after DST ends
    '2026-11-14T13:00:00.000Z',
    '2026-11-21T13:00:00.000Z',
    '2026-11-28T13:00:00.000Z',
  ])
})

test('monthly ordinal RRULE (first Friday, last Saturday)', () => {
  const start = parseIcsDate({ value: '20261002T180000', params: { TZID: TZ } }, TZ)
  const ws = new Date('2026-10-01T00:00:00Z')
  const we = new Date('2027-01-31T00:00:00Z')
  const firstFri = expandRRule(start, 'FREQ=MONTHLY;BYDAY=1FR', { windowStart: ws, windowEnd: we }).map((d) => localDateKey(d, TZ))
  assert.deepEqual(firstFri, ['2026-10-02', '2026-11-06', '2026-12-04', '2027-01-01'])
  const s2 = parseIcsDate({ value: '20261031T100000', params: { TZID: TZ } }, TZ)
  const lastSat = expandRRule(s2, 'FREQ=MONTHLY;BYDAY=-1SA;UNTIL=20261231', { windowStart: ws, windowEnd: we }).map((d) => localDateKey(d, TZ))
  assert.deepEqual(lastSat, ['2026-10-31', '2026-11-28', '2026-12-26'])
})

test('normalizeEvent shapes data and filters non-Georgia', () => {
  const source = { id: 'test', name: 'Test Source', website: 'https://example.gov', defaults: { city: 'Decatur' } }
  const ev = normalizeEvent({
    uid: 'x', title: '<b>Jazz</b> in the Park', description: 'Free admission. <p>Bring chairs</p>',
    start: new Date('2026-10-10T23:00:00Z'), location: 'Glenlake Park, 1121 Church St, Decatur, GA', url: 'https://example.gov/jazz',
  }, source)
  assert.equal(ev.title, 'Jazz in the Park')
  assert.equal(ev.city, 'Decatur')
  assert.equal(ev.category, 'live-music')
  assert.equal(ev.price.isFree, true)
  assert.equal(ev.source.name, 'Test Source')
  assert.equal(normalizeEvent({ title: 'Beach day', start: new Date(), location: 'Pier, Jacksonville, FL' }, source), null)
  assert.equal(normalizeEvent({ title: 'x', start: new Date(), state: 'TN' }, source), null)
  assert.equal(normalizeEvent({ title: '', start: new Date() }, source), null)
  assert.equal(normalizeEvent({ title: 'bad link', start: new Date(), url: 'javascript:alert(1)' }, { id: 's', name: 's' }).url, '')
})

test('manual event validation', () => {
  const good = { title: 'Art Walk', start: '2026-10-10T18:00', city: 'Atlanta', category: 'arts-theater', price: 'free', url: 'https://example.org' }
  assert.deepEqual(validateManualEvent(good, 0), [])
  const errs = validateManualEvent({ title: 'Oops', start: 'Saturday', category: 'music' }, 1)
  assert.ok(errs.length >= 4)
  const raw = manualToRaw({ ...good, start: '2026-10-10' })
  assert.equal(raw.allDay, true)
  assert.ok(raw.end > raw.start)
})

test('JSON-LD extraction handles @graph, arrays and offers', () => {
  const html = `<html><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"MusicEvent","name":"Show","startDate":"2026-10-10T20:00:00-04:00","location":{"@type":"Place","name":"The Earl","address":{"streetAddress":"488 Flat Shoals Ave","addressLocality":"Atlanta","addressRegion":"GA"}},"offers":[{"price":"18"},{"price":"22"}]}]}</script>
  <script type="application/ld+json">[{"@type":"Event","name":"Free Fest","startDate":"2026-10-11","isAccessibleForFree":true}]</script>
  <script type="application/ld+json">{ not json</script></html>`
  const nodes = extractJsonLdEvents(html)
  assert.deepEqual(nodes.map((n) => n.name), ['Show', 'Free Fest'])
})

test('robots.txt rules', () => {
  const robots = 'User-agent: *\nDisallow: /private\nAllow: /private/events\n\nUser-agent: BadBot\nDisallow: /'
  assert.equal(isAllowedByRobots(robots, '/events'), true)
  assert.equal(isAllowedByRobots(robots, '/private/stuff'), false)
  assert.equal(isAllowedByRobots(robots, '/private/events/today'), true)
  assert.equal(isAllowedByRobots('User-agent: GeorgiaWeekendFinderBot\nDisallow: /', '/anything'), false)
  assert.equal(isAllowedByRobots('', '/anything'), true)
})

test('sources run only when enabled AND permission approved', () => {
  const base = { id: 'a', name: 'A', type: 'ics', url: 'https://x.test/cal.ics', enabled: true }
  assert.equal(sourceIsRunnable({ ...base, permission: { status: 'pending' } }).ok, false)
  assert.equal(sourceIsRunnable({ ...base, permission: { status: 'approved' } }).ok, false)
  assert.equal(sourceIsRunnable({ ...base, enabled: false, permission: { status: 'approved', basis: 'terms', verifiedOn: '2026-10-01' } }).ok, false)
  assert.equal(sourceIsRunnable({ ...base, permission: { status: 'approved', basis: 'terms', verifiedOn: '2026-10-01' } }).ok, true)
  assert.equal(sourceIsRunnable({ ...base, type: 'scrape-anything', permission: { status: 'approved', basis: 'x', verifiedOn: 'y' } }).ok, false)
})

test('misc helpers', () => {
  assert.equal(stripHtml('Tom &amp; Jerry<br>Live'), 'Tom & Jerry\nLive')
  assert.equal(getPath({ a: { b: [1, 2] } }, 'a.b.1'), 2)
})
