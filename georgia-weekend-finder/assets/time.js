// Timezone helpers with no dependencies. All event times are stored as UTC
// ISO strings and displayed / filtered in America/New_York.

const partsFormatters = new Map()

function formatterFor(tz) {
  if (!partsFormatters.has(tz)) {
    partsFormatters.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
    }))
  }
  return partsFormatters.get(tz)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Wall-clock parts of an instant in a timezone.
export function zonedParts(date, tz) {
  const out = {}
  for (const p of formatterFor(tz).formatToParts(date)) out[p.type] = p.value
  return {
    year: +out.year, month: +out.month, day: +out.day,
    hour: +out.hour, minute: +out.minute, second: +out.second,
    weekday: WEEKDAYS.indexOf(out.weekday),
  }
}

function offsetMs(ts, tz) {
  const p = zonedParts(new Date(ts), tz)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000
}

// Convert a wall-clock time in `tz` to a UTC Date. Handles DST transitions.
export function zonedToUtc(year, month, day, hour = 0, minute = 0, second = 0, tz) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second)
  const first = guess - offsetMs(guess, tz)
  // Re-check with the offset at the candidate instant (differs near DST).
  return new Date(guess - offsetMs(first, tz))
}

export function isValidTimeZone(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true } catch { return false }
}

// Parse the date formats seen in feeds and in hand-curated JSON:
//   2026-10-10                    -> all-day, local midnight
//   2026-10-10T19:00[:00]         -> local wall time in `tz`
//   2026-10-10T19:00:00-04:00 / Z -> exact instant
export function parseLooseDate(value, tz) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return { date: zonedToUtc(+m[1], +m[2], +m[3], 0, 0, 0, tz), allDay: true }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/)
  if (m) return { date: zonedToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0), tz), allDay: false }
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s) && /(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : { date: d, allDay: false }
  }
  return null
}

// Start of the local calendar day containing `date`, plus `addDays`.
export function startOfLocalDay(date, tz, addDays = 0) {
  const p = zonedParts(date, tz)
  const noonUtc = new Date(Date.UTC(p.year, p.month - 1, p.day + addDays, 12))
  return zonedToUtc(noonUtc.getUTCFullYear(), noonUtc.getUTCMonth() + 1, noonUtc.getUTCDate(), 0, 0, 0, tz)
}

// YYYY-MM-DD of an instant in tz.
export function localDateKey(date, tz) {
  const p = zonedParts(date, tz)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

// Friday 00:00 through Sunday 23:59 of the current weekend. If it's already
// the weekend, the range starts now-ish (today) and keeps the same end.
export function weekendRange(now, tz) {
  const wd = zonedParts(now, tz).weekday // 0 Sun .. 6 Sat
  const startOffset = wd === 0 || wd >= 5 ? 0 : 5 - wd
  const daysToSunday = wd === 0 ? 0 : 7 - wd
  return {
    start: startOfLocalDay(now, tz, startOffset),
    end: startOfLocalDay(now, tz, daysToSunday + 1),
  }
}
