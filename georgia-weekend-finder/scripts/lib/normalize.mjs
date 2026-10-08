// Turns raw events from any adapter (or the manual file) into the single
// shape the website reads from data/events.json.
import { createHash } from 'node:crypto'
import { TIMEZONE, CATEGORY_IDS, OTHER_CITY, matchCity, inferCategory, cityByName } from '../../assets/taxonomy.js'
import { parseLooseDate } from '../../assets/time.js'

export function stripHtml(s) {
  if (!s) return ''
  return String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function truncate(s, n) {
  if (!s || s.length <= n) return s || ''
  return s.slice(0, n).replace(/\s+\S*$/, '') + '…'
}

// Only call something free when the text clearly says so. Phrases like
// "gluten-free" or "free parking" must not flip an event to free.
const FREE_RE = /\b(free admission|admission is free|admission: ?free|free entry|free event|free to attend|free and open to the public|free for all ages|no cost|no charge|cost: ?free|price: ?free|tickets: ?free)\b|^free\b/i
const PRICE_RE = /\$\s?(\d+(?:\.\d{2})?)(?:\s?[-–]\s?\$?\s?(\d+(?:\.\d{2})?))?/

export function inferPrice(text) {
  if (!text) return { isFree: null, min: null, max: null, text: '' }
  if (FREE_RE.test(text)) return { isFree: true, min: 0, max: 0, text: 'Free' }
  const m = text.match(PRICE_RE)
  if (m) {
    const min = parseFloat(m[1])
    const max = m[2] ? parseFloat(m[2]) : min
    if (min === 0 && max === 0) return { isFree: true, min: 0, max: 0, text: 'Free' }
    return { isFree: false, min, max, text: max > min ? `$${fmt(min)}–$${fmt(max)}` : `$${fmt(min)}` }
  }
  return { isFree: null, min: null, max: null, text: '' }
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

// Accepts "free", "$15", "$10-$25", 15, {min,max}, {isFree,...}.
export function normalizePrice(value) {
  if (value == null || value === '') return { isFree: null, min: null, max: null, text: '' }
  if (typeof value === 'number') {
    return value === 0 ? { isFree: true, min: 0, max: 0, text: 'Free' } : { isFree: false, min: value, max: value, text: `$${fmt(value)}` }
  }
  if (typeof value === 'object') {
    if (value.isFree === true) return { isFree: true, min: 0, max: 0, text: 'Free' }
    const min = value.min != null ? Number(value.min) : null
    const max = value.max != null ? Number(value.max) : min
    if (min === 0 && (max === 0 || max == null)) return { isFree: true, min: 0, max: 0, text: 'Free' }
    if (min != null) return { isFree: false, min, max, text: value.text || (max > min ? `$${fmt(min)}–$${fmt(max)}` : `$${fmt(min)}`) }
    return { isFree: value.isFree ?? null, min: null, max: null, text: value.text || '' }
  }
  const s = String(value).trim()
  if (/^free$/i.test(s)) return { isFree: true, min: 0, max: 0, text: 'Free' }
  if (/^paid$/i.test(s)) return { isFree: false, min: null, max: null, text: 'Tickets required' }
  const p = inferPrice(s)
  if (p.isFree == null) return { isFree: null, min: null, max: null, text: s }
  return p
}

const NON_GA_STATE = /,\s*(AL|FL|SC|NC|TN|Alabama|Florida|South Carolina|North Carolina|Tennessee)\b(\s+\d{5})?/

export function makeId(...parts) {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)
}

function toIso(d) {
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null
}

function cleanUrl(u) {
  if (!u) return ''
  try {
    const url = new URL(String(u).trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

// raw: { uid?, title, description?, start: Date, end?: Date, allDay?, venue?,
//        address?, location?, city?, state?, url?, ticketUrl?, image?, price?,
//        categories?: string[], category? }
// source: entry from sources.json (or the manual pseudo-source)
export function normalizeEvent(raw, source) {
  const title = stripHtml(raw.title).replace(/\s+/g, ' ').trim()
  if (!title || !(raw.start instanceof Date) || Number.isNaN(raw.start.getTime())) return null

  const description = truncate(stripHtml(raw.description), 500)
  const location = stripHtml(raw.location || [raw.venue, raw.address].filter(Boolean).join(', '))
  if (raw.state && !/^(GA|Georgia)$/i.test(raw.state)) return null
  if (NON_GA_STATE.test(location)) return null

  const defaults = source.defaults || {}
  const venue = stripHtml(raw.venue || (location.split(',')[0] || '')).trim()
  const city = (raw.city && matchCity(raw.city)) || matchCity(location) || (raw.city ? String(raw.city).trim() : '') || defaults.city || OTHER_CITY
  if (cityByName(city)?.active === false) return null // recognized, but outside current coverage

  let category = raw.category && CATEGORY_IDS.includes(raw.category) ? raw.category : null
  if (!category && source.categoryMap && raw.categories) {
    for (const c of raw.categories) {
      const mapped = source.categoryMap[c] || source.categoryMap[c.toLowerCase()]
      if (mapped && CATEGORY_IDS.includes(mapped)) { category = mapped; break }
    }
  }
  if (!category) {
    category = inferCategory(`${title} ${(raw.categories || []).join(' ')} ${description}`, defaults.category || undefined)
  }

  let price = raw.price != null ? normalizePrice(raw.price) : inferPrice(`${title}\n${description}`)
  if (price.isFree == null && defaults.price) price = normalizePrice(defaults.price)

  const url = cleanUrl(raw.url) || cleanUrl(source.website)
  const end = raw.end instanceof Date && raw.end > raw.start ? raw.end : null

  return {
    id: raw.id || makeId(source.id, raw.uid || url || title, raw.start.toISOString()),
    title: truncate(title, 140),
    description,
    start: toIso(raw.start),
    end: toIso(end),
    allDay: !!raw.allDay,
    venue: truncate(venue, 120),
    address: truncate(stripHtml(raw.address || location), 200),
    city,
    category,
    price,
    url,
    ticketUrl: cleanUrl(raw.ticketUrl),
    image: cleanUrl(raw.image),
    featured: !!raw.featured,
    sponsored: !!raw.sponsored,
    source: { id: source.id, name: source.name, url: cleanUrl(source.website) },
  }
}

// Validates one entry of data/manual-events.json. Returns a list of errors.
export function validateManualEvent(e, index) {
  const errs = []
  const where = `manual-events.json events[${index}]${e && e.title ? ` ("${e.title}")` : ''}`
  if (!e || typeof e !== 'object') return [`${where}: must be an object`]
  if (!e.title || typeof e.title !== 'string') errs.push(`${where}: "title" is required`)
  if (!parseLooseDate(e.start, TIMEZONE)) errs.push(`${where}: "start" must look like 2026-10-10, 2026-10-10T19:00 or an ISO time with offset`)
  if (e.end != null && !parseLooseDate(e.end, TIMEZONE)) errs.push(`${where}: "end" has an invalid date`)
  if (!e.city) errs.push(`${where}: "city" is required`)
  if (!CATEGORY_IDS.includes(e.category)) errs.push(`${where}: "category" must be one of ${CATEGORY_IDS.join(', ')}`)
  if (!e.url && !e.ticketUrl) errs.push(`${where}: add "url" (official event page) so visitors can verify details`)
  if (e.price == null) errs.push(`${where}: "price" is required ("free", "$15", "$10-$25", or "paid")`)
  return errs
}

export function manualToRaw(e) {
  const start = parseLooseDate(e.start, TIMEZONE)
  const end = e.end ? parseLooseDate(e.end, TIMEZONE) : null
  return {
    id: e.id,
    uid: e.id || `${e.title}|${e.start}`,
    title: e.title,
    description: e.description,
    start: start.date,
    end: end ? (end.allDay ? new Date(end.date.getTime() + 86400000 - 1) : end.date) : (start.allDay ? new Date(start.date.getTime() + 86400000 - 1) : null),
    allDay: start.allDay,
    venue: e.venue,
    address: e.address,
    city: e.city,
    category: e.category,
    price: e.price,
    url: e.url,
    ticketUrl: e.ticketUrl,
    image: e.image,
    featured: e.featured,
    sponsored: e.sponsored,
  }
}

export function dedupeKey(ev) {
  const t = ev.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return `${t}|${ev.start.slice(0, 13)}|${ev.city.toLowerCase()}`
}
