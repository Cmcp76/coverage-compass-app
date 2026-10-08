// Pure functions shared by the page builder (Node) and the browser, so the
// pre-rendered HTML search engines see matches what visitors see.
import { TIMEZONE, categoryById, slugify } from './taxonomy.js'
import { zonedToUtc, zonedParts, startOfLocalDay, localDateKey, weekendRange } from './time.js'
import { DATE_NIGHT_CATEGORIES } from './sections.js'

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export function safeUrl(u) {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}

export const fmt = {
  time: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' }),
  day: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }),
  short: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' }),
  long: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  monthDay: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, month: 'short', day: 'numeric' }),
  month: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, month: 'long', year: 'numeric' }),
}

// ---------- event helpers ----------
export function effectiveEnd(e) {
  if (e.end) return new Date(e.end)
  const s = new Date(e.start)
  return new Date(s.getTime() + (e.allDay ? 86400000 - 1 : 2 * 3600000))
}

export function whenText(e, { long = false } = {}) {
  const f = long ? fmt.long : fmt.short
  const s = new Date(e.start)
  const end = e.end ? new Date(e.end) : null
  const multiDay = end && localDateKey(s, TIMEZONE) !== localDateKey(new Date(end.getTime() - 1), TIMEZONE)
  if (multiDay) return `${f.format(s)} – ${f.format(new Date(end.getTime() - (e.allDay ? 1 : 0)))}`
  if (e.allDay) return `${f.format(s)} · All day`
  return `${f.format(s)} · ${fmt.time.format(s)}${end ? ` – ${fmt.time.format(end)}` : ''}`
}

export function priceLabel(e) {
  if (e.price?.isFree === true) return 'Free'
  if (e.price?.text) return e.price.text
  if (e.price?.isFree === false) return 'Tickets required'
  return 'See official site'
}

export function priceBadge(e) {
  if (e.price?.isFree === true) return '<span class="badge free">Free</span>'
  if (e.price?.text) return `<span class="badge price">${esc(e.price.text)}</span>`
  if (e.price?.isFree === false) return '<span class="badge price">Tickets</span>'
  return ''
}

// Descriptive, stable URL: /event/2026-10-10-jazz-on-the-square-decatur-a1b2c3/
export function eventSlug(e) {
  const day = localDateKey(new Date(e.start), TIMEZONE)
  const words = slugify(`${e.title} ${e.city || ''}`).split('-').slice(0, 10).join('-')
  return `${day}-${words}-${String(e.id).slice(0, 6)}`
}

export function eventPath(e) {
  return `/event/${eventSlug(e)}/`
}

export function isDateNight(e) {
  if (!DATE_NIGHT_CATEGORIES.includes(e.category) || e.allDay) return false
  if (/\b(kids?|children|toddlers?|storytime|family)\b/i.test(e.title)) return false
  return zonedParts(new Date(e.start), TIMEZONE).hour >= 17
}

// ---------- filtering ----------
export const DATE_PRESETS = [
  { id: 'weekend', label: 'This Weekend', title: 'This weekend' },
  { id: 'today', label: 'Today', title: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow', title: 'Tomorrow' },
  { id: 'week', label: 'Next 7 Days', title: 'The next 7 days' },
  { id: 'month', label: 'Next 30 Days', title: 'The next 30 days' },
  { id: 'all', label: 'All Upcoming', title: 'All upcoming events' },
  { id: 'custom', label: 'Pick Dates', title: 'Your dates' },
]

function dateInputToUtc(value, addDays = 0) {
  const [y, m, d] = value.split('-').map(Number)
  return zonedToUtc(y, m, d + addDays, 0, 0, 0, TIMEZONE)
}

export function rangeFor(state, now = new Date()) {
  const day = (n) => startOfLocalDay(now, TIMEZONE, n)
  switch (state.when) {
    case 'today': return { start: now, end: day(1) }
    case 'tomorrow': return { start: day(1), end: day(2) }
    case 'week': return { start: now, end: day(7) }
    case 'month': return { start: now, end: day(30) }
    case 'all': return { start: now, end: day(3650) }
    case 'custom': {
      const start = state.from ? dateInputToUtc(state.from) : now
      const end = state.to ? dateInputToUtc(state.to, 1) : day(3650)
      return { start: start < now ? now : start, end }
    }
    default: {
      const r = weekendRange(now, TIMEZONE)
      return { start: r.start < now ? now : r.start, end: r.end }
    }
  }
}

export function matches(e, range, state, { ignoreCats = false } = {}) {
  if (new Date(e.start) >= range.end || effectiveEnd(e) < range.start) return false
  const cats = state.cats instanceof Set ? state.cats : new Set(state.cats || [])
  if (!ignoreCats && cats.size && !cats.has(e.category)) return false
  if (state.city && e.city !== state.city) return false
  if (state.price === 'free' && e.price?.isFree !== true) return false
  if (state.price === 'paid' && e.price?.isFree !== false) return false
  if (state.dateNight && !isDateNight(e)) return false
  if (state.q) {
    const hay = `${e.title} ${e.venue} ${e.city} ${e.description} ${categoryById(e.category).label}`.toLowerCase()
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

// Day order, then promoted (featured/sponsored) first within a day, then time.
export function sortResults(results, range) {
  const t = (e) => Math.max(new Date(e.start).getTime(), range.start.getTime())
  const day = (e) => localDateKey(new Date(t(e)), TIMEZONE)
  const promoted = (e) => (e.featured || e.sponsored ? 1 : 0)
  return [...results].sort((a, b) => day(a).localeCompare(day(b)) || promoted(b) - promoted(a) || t(a) - t(b) || a.title.localeCompare(b.title))
}

export function filterEvents(events, state, now = new Date()) {
  const range = rangeFor(state, now)
  return { range, results: sortResults(events.filter((e) => matches(e, range, state)), range) }
}

// ---------- HTML ----------
export function cardHtml(e) {
  const cat = categoryById(e.category)
  const img = safeUrl(e.image)
  const label = e.sponsored ? '<span class="badge featured">Sponsored</span>' : e.featured ? '<span class="badge featured">Featured</span>' : ''
  return `<article class="event-card${e.featured || e.sponsored ? ' is-featured' : ''}" style="--cat:${cat.color}">
    <div class="media">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span aria-hidden="true">${cat.emoji}</span></div>
    <div class="body">
      <div class="badges"><span class="badge">${esc(cat.label)}</span>${priceBadge(e)}${label}</div>
      <h3><a href="${esc(eventPath(e))}" data-open="${esc(e.id)}">${esc(e.title)}</a></h3>
      <div class="meta"><span>🗓 ${esc(whenText(e))}</span>${e.venue || e.city ? `<span>📍 ${esc([e.venue, e.city].filter(Boolean).join(' · '))}</span>` : ''}</div>
      <div class="via">via ${esc(e.source?.name || 'Georgia Weekend Finder')}</div>
    </div>
  </article>`
}

export function dayHeading(key, now) {
  const today = localDateKey(now, TIMEZONE)
  const tomorrow = localDateKey(startOfLocalDay(now, TIMEZONE, 1), TIMEZONE)
  const [y, m, d] = key.split('-').map(Number)
  const noon = zonedToUtc(y, m, d, 12, 0, 0, TIMEZONE)
  const name = key === today ? 'Today' : key === tomorrow ? 'Tomorrow' : fmt.day.format(noon)
  return `<h3 class="day-label">${name} <small>${fmt.monthDay.format(noon)}</small></h3>`
}

// Day-grouped result list. `adHtml` (browser only) is inserted every N cards.
export function listHtml(results, range, now, { limit = 60, adHtml = null, adEvery = 8, maxAds = 3 } = {}) {
  const shown = results.slice(0, limit)
  const groups = new Map()
  for (const e of shown) {
    const key = localDateKey(new Date(Math.max(new Date(e.start), range.start)), TIMEZONE)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  }
  let html = ''
  let n = 0
  let ads = 0
  for (const [key, events] of groups) {
    html += `<section class="day-group">${dayHeading(key, now)}<div class="grid">`
    for (const e of events) {
      html += cardHtml(e)
      n++
      if (adHtml && n % adEvery === 0 && ads < maxAds) { html += adHtml; ads++ }
    }
    html += '</div></section>'
  }
  if (results.length > shown.length) {
    html += `<p class="more-wrap"><button class="btn btn-ghost" type="button" data-action="more">Show more (${results.length - shown.length} left)</button></p>`
  }
  return html
}

export function emptyHtml({ hasAny, error = false }) {
  if (error) return '<div class="big">⚠️</div><h3>We couldn’t load events right now</h3><p>Please refresh in a moment.</p>'
  if (hasAny) {
    return `<div class="big">🔍</div><h3>Nothing matches those filters</h3><p>Try a wider date range, another city, or fewer categories.</p>
      <button class="btn btn-primary" type="button" data-action="clear">Clear filters</button> <button class="btn btn-ghost" type="button" data-action="all">See all upcoming</button>`
  }
  return `<div class="big">🍑</div><h3>Fresh listings are on the way</h3><p>We only publish events from approved sources and reviewed submissions, so the calendar fills up as those come in. Hosting something? Be one of the first listed.</p>
    <a class="btn btn-primary" href="/submit/">Submit an event</a>`
}

// schema.org Event for one listing (Google event results).
export function eventJsonLd(e, siteUrl) {
  const url = safeUrl(e.url)
  const offers = e.price?.isFree === true
    ? { '@type': 'Offer', price: 0, priceCurrency: 'USD', url: url || undefined }
    : e.price?.min != null ? { '@type': 'Offer', price: e.price.min, priceCurrency: 'USD', url: safeUrl(e.ticketUrl) || url || undefined } : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.start,
    ...(e.end ? { endDate: e.end } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: e.venue || e.city,
      address: { '@type': 'PostalAddress', streetAddress: e.address || undefined, addressLocality: e.city, addressRegion: 'GA', addressCountry: 'US' },
    },
    ...(e.description ? { description: e.description } : {}),
    ...(safeUrl(e.image) ? { image: [e.image] } : {}),
    url: siteUrl ? `${siteUrl.replace(/\/$/, '')}${eventPath(e)}` : url || undefined,
    ...(offers ? { offers } : {}),
    ...(e.price?.isFree === true ? { isAccessibleForFree: true } : {}),
  }
}

export function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}
