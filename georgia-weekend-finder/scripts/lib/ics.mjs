// Minimal iCalendar (RFC 5545) reader: VEVENTs, TZID/UTC/floating/all-day
// dates, and common RRULE patterns. No dependencies.
import { zonedToUtc, zonedParts, isValidTimeZone } from '../../assets/time.js'

const WINDOWS_TZ = {
  'eastern standard time': 'America/New_York',
  'us/eastern': 'America/New_York',
  'est': 'America/New_York',
  'central standard time': 'America/Chicago',
  'pacific standard time': 'America/Los_Angeles',
  'mountain standard time': 'America/Denver',
}

function splitLine(line) {
  // NAME;PARAM=a;PARAM="b:c":VALUE  (colons may appear inside quotes)
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuote = !inQuote
    else if (ch === ':' && !inQuote) {
      const head = line.slice(0, i)
      const value = line.slice(i + 1)
      const [name, ...rawParams] = head.split(';')
      const params = {}
      for (const p of rawParams) {
        const eq = p.indexOf('=')
        if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '')
      }
      return { name: name.toUpperCase(), params, value }
    }
  }
  return null
}

export function unescapeText(v) {
  return v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1')
}

export function parseICS(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const events = []
  let current = null
  let depth = 0
  for (const line of lines) {
    if (!line) continue
    if (/^BEGIN:VEVENT$/i.test(line)) { current = {}; depth = 0; continue }
    if (!current) continue
    if (/^BEGIN:/i.test(line)) { depth++; continue } // e.g. VALARM
    if (/^END:VEVENT$/i.test(line)) { events.push(current); current = null; continue }
    if (/^END:/i.test(line)) { depth--; continue }
    if (depth > 0) continue
    const prop = splitLine(line)
    if (!prop) continue
    ;(current[prop.name] ||= []).push(prop)
  }
  return events
}

function resolveTz(tzid, fallback) {
  if (!tzid) return fallback
  const mapped = WINDOWS_TZ[tzid.toLowerCase()] || tzid
  return isValidTimeZone(mapped) ? mapped : fallback
}

// Returns { date, allDay, tz, wall: {y,m,d,h,mi,s} } or null.
export function parseIcsDate(prop, defaultTz) {
  if (!prop) return null
  const v = prop.value.trim()
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  const allDay = prop.params.VALUE === 'DATE' || h === undefined
  const tz = resolveTz(prop.params.TZID, defaultTz)
  if (allDay) {
    return { date: zonedToUtc(+y, +mo, +d, 0, 0, 0, tz), allDay: true, tz, wall: { y: +y, m: +mo, d: +d, h: 0, mi: 0, s: 0 } }
  }
  if (z) {
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s || 0)))
    // Recurrences of a UTC event still follow local wall time for DST.
    const p = zonedParts(date, tz)
    return { date, allDay: false, tz, wall: { y: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second } }
  }
  return {
    date: zonedToUtc(+y, +mo, +d, +h, +mi, +(s || 0), tz), allDay: false, tz,
    wall: { y: +y, m: +mo, d: +d, h: +h, mi: +mi, s: +(s || 0) },
  }
}

function parseDuration(v) {
  const m = v && v.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return null
  const [, sign, w, d, h, mi, s] = m
  const ms = ((+w || 0) * 7 * 86400 + (+d || 0) * 86400 + (+h || 0) * 3600 + (+mi || 0) * 60 + (+s || 0)) * 1000
  return sign === '-' ? -ms : ms
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function parseRRule(v) {
  const r = {}
  for (const part of v.split(';')) {
    const [k, val] = part.split('=')
    if (k && val) r[k.toUpperCase()] = val
  }
  return r
}

function addDaysWall(wall, n) {
  const t = new Date(Date.UTC(wall.y, wall.m - 1, wall.d + n))
  return { ...wall, y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

function weekdayOf(wall) {
  return new Date(Date.UTC(wall.y, wall.m - 1, wall.d)).getUTCDay()
}

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

// nth weekday of a month: n=1 first, n=-1 last.
function nthWeekday(y, m, weekday, n) {
  if (n > 0) {
    const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
    const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7
    return day <= daysInMonth(y, m) ? day : null
  }
  const last = daysInMonth(y, m)
  const lastWd = new Date(Date.UTC(y, m - 1, last)).getUTCDay()
  const day = last - ((lastWd - weekday + 7) % 7) + (n + 1) * 7
  return day >= 1 ? day : null
}

// Expand a recurring event into start instants inside [windowStart, windowEnd].
// Supports FREQ=DAILY|WEEKLY|MONTHLY|YEARLY with INTERVAL, COUNT, UNTIL,
// BYDAY (weekly days, or monthly ordinals like 1FR / -1SA) and BYMONTHDAY.
export function expandRRule(start, rruleValue, { windowStart, windowEnd, exdates = new Set(), maxOccurrences = 400 }) {
  const r = parseRRule(rruleValue)
  const freq = r.FREQ
  const interval = Math.max(1, parseInt(r.INTERVAL || '1', 10))
  const count = r.COUNT ? parseInt(r.COUNT, 10) : Infinity
  let until = null
  if (r.UNTIL) {
    const u = parseIcsDate({ value: r.UNTIL, params: {} }, start.tz)
    // A date-only UNTIL includes that whole day.
    until = u ? new Date(u.date.getTime() + (u.allDay ? 86400000 - 1 : 0)) : null
  }
  const toDate = (w) => (start.allDay
    ? zonedToUtc(w.y, w.m, w.d, 0, 0, 0, start.tz)
    : zonedToUtc(w.y, w.m, w.d, w.h, w.mi, w.s, start.tz))

  const out = []
  let produced = 0
  const emit = (w) => {
    const d = toDate(w)
    if (d < start.date) return true
    if (until && d > until) return false
    if (d > windowEnd) return false
    produced++
    if (produced > count) return false
    if (d >= windowStart && !exdates.has(d.getTime())) out.push(d)
    return out.length < maxOccurrences
  }

  const byDay = r.BYDAY ? r.BYDAY.split(',') : null
  const hardStop = 3000
  if (freq === 'DAILY') {
    for (let i = 0, w = start.wall; i < hardStop; i++, w = addDaysWall(w, interval)) if (!emit(w)) break
  } else if (freq === 'WEEKLY') {
    const days = byDay ? byDay.map((c) => DAY_CODES.indexOf(c.slice(-2))).filter((n) => n >= 0).sort() : [weekdayOf(start.wall)]
    // Anchor on the Sunday of the start week.
    let weekStart = addDaysWall(start.wall, -weekdayOf(start.wall))
    outer: for (let i = 0; i < hardStop; i++, weekStart = addDaysWall(weekStart, 7 * interval)) {
      for (const wd of days) if (!emit(addDaysWall(weekStart, wd))) break outer
    }
  } else if (freq === 'MONTHLY') {
    let y = start.wall.y
    let m = start.wall.m
    outer: for (let i = 0; i < hardStop; i++) {
      const days = []
      if (byDay) {
        for (const code of byDay) {
          const mm = code.match(/^([+-]?\d)?(SU|MO|TU|WE|TH|FR|SA)$/)
          if (!mm) continue
          const d = nthWeekday(y, m, DAY_CODES.indexOf(mm[2]), mm[1] ? parseInt(mm[1], 10) : 1)
          if (d) days.push(d)
        }
      } else {
        const md = r.BYMONTHDAY ? r.BYMONTHDAY.split(',').map(Number) : [start.wall.d]
        for (const d of md) if (d >= 1 && d <= daysInMonth(y, m)) days.push(d)
      }
      for (const d of days.sort((a, b) => a - b)) if (!emit({ ...start.wall, y, m, d })) break outer
      m += interval
      while (m > 12) { m -= 12; y++ }
    }
  } else if (freq === 'YEARLY') {
    for (let i = 0, y = start.wall.y; i < 200; i++, y += interval) {
      if (start.wall.d > daysInMonth(y, start.wall.m)) continue
      if (!emit({ ...start.wall, y })) break
    }
  } else {
    if (start.date >= windowStart && start.date <= windowEnd) out.push(start.date)
  }
  return out
}

const first = (ev, name) => (ev[name] ? ev[name][0] : null)

// Turn a parsed calendar into flat raw events (one per occurrence).
export function icsToRawEvents(text, { defaultTz, windowStart, windowEnd }) {
  const vevents = parseICS(text)
  const overridden = new Map() // UID -> Set of recurrence-id timestamps
  for (const ev of vevents) {
    const rid = first(ev, 'RECURRENCE-ID')
    const uid = first(ev, 'UID')?.value
    if (rid && uid) {
      const d = parseIcsDate(rid, defaultTz)
      if (d) {
        if (!overridden.has(uid)) overridden.set(uid, new Set())
        overridden.get(uid).add(d.date.getTime())
      }
    }
  }

  const raw = []
  for (const ev of vevents) {
    const status = first(ev, 'STATUS')?.value?.toUpperCase()
    if (status === 'CANCELLED') continue
    const start = parseIcsDate(first(ev, 'DTSTART'), defaultTz)
    if (!start) continue
    const endProp = parseIcsDate(first(ev, 'DTEND'), defaultTz)
    let durationMs = endProp ? endProp.date - start.date : parseDuration(first(ev, 'DURATION')?.value)
    if (durationMs == null || durationMs < 0) durationMs = start.allDay ? 86400000 : null

    const uid = first(ev, 'UID')?.value || ''
    const base = {
      uid,
      title: unescapeText(first(ev, 'SUMMARY')?.value || ''),
      description: unescapeText(first(ev, 'DESCRIPTION')?.value || ''),
      location: unescapeText(first(ev, 'LOCATION')?.value || ''),
      url: first(ev, 'URL')?.value || '',
      categories: (ev.CATEGORIES || []).flatMap((p) => unescapeText(p.value).split(',')).map((s) => s.trim()).filter(Boolean),
      allDay: start.allDay,
    }

    const rrule = first(ev, 'RRULE')
    let starts
    if (rrule && !first(ev, 'RECURRENCE-ID')) {
      const exdates = new Set(overridden.get(uid) || [])
      for (const p of ev.EXDATE || []) {
        for (const v of p.value.split(',')) {
          const d = parseIcsDate({ value: v, params: p.params }, defaultTz)
          if (d) exdates.add(d.date.getTime())
        }
      }
      // Look back by the duration so multi-day occurrences already underway are kept.
      const lookback = new Date(windowStart.getTime() - (durationMs || 0))
      starts = expandRRule(start, rrule.value, { windowStart: lookback, windowEnd, exdates })
    } else {
      starts = [start.date]
    }
    for (const s of starts) {
      raw.push({ ...base, start: s, end: durationMs != null ? new Date(s.getTime() + durationMs) : null })
    }
  }
  return raw
}
