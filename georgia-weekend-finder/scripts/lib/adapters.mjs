// One adapter per source "type" in data/sources.json. Every adapter returns
// raw events; normalize.mjs turns them into the published shape.
import { icsToRawEvents } from './ics.mjs'
import { parseLooseDate } from '../../assets/time.js'

export const USER_AGENT = 'GeorgiaWeekendFinderBot/1.0 (+https://github.com/cmcp76/coverage-compass-app/tree/main/georgia-weekend-finder)'

export async function fetchText(url, { headers = {}, timeoutMs = 20000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${redactKey(url)}`)
  return res.text()
}

export function redactKey(url) {
  return String(url).replace(/(apikey|api_key|key|token)=[^&]+/gi, '$1=***')
}

// Basic robots.txt check for page-scraping adapters: honours Disallow rules
// in the "*" group and in a group naming our bot.
export function isAllowedByRobots(robotsTxt, path, agent = 'GeorgiaWeekendFinderBot') {
  const groups = []
  let current = null
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const val = line.slice(idx + 1).trim()
    if (key === 'user-agent') {
      if (!current || current.rules.length) { current = { agents: [], rules: [] }; groups.push(current) }
      current.agents.push(val.toLowerCase())
    } else if (current && (key === 'disallow' || key === 'allow')) {
      current.rules.push({ allow: key === 'allow', path: val })
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.toLowerCase().includes(a)))
  const applicable = mine.length ? mine : groups.filter((g) => g.agents.includes('*'))
  let best = null
  for (const g of applicable) {
    for (const r of g.rules) {
      if (!r.path) continue
      const re = new RegExp('^' + r.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'))
      if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r
    }
  }
  return !best || best.allow
}

async function assertRobotsAllows(url) {
  const u = new URL(url)
  let robots = ''
  try {
    robots = await fetchText(`${u.origin}/robots.txt`, { timeoutMs: 10000 })
  } catch {
    return // no robots.txt (or unreachable) = no restrictions declared
  }
  if (!isAllowedByRobots(robots, u.pathname + u.search)) {
    throw new Error(`robots.txt at ${u.origin} disallows ${u.pathname}; skipping`)
  }
}

// ---------- ics ----------
async function ics(source, ctx) {
  const text = await fetchText(source.url, { headers: { Accept: 'text/calendar, */*' } })
  return icsToRawEvents(text, { defaultTz: ctx.tz, windowStart: ctx.windowStart, windowEnd: ctx.windowEnd })
    .map((e) => ({ ...e, ...splitLocation(e.location) }))
}

function splitLocation(location) {
  if (!location) return {}
  const [venue, ...rest] = location.split(/,\s*/)
  return { venue, address: rest.join(', ') }
}

// ---------- jsonld (schema.org Event on a public events page) ----------
export function extractJsonLdEvents(html) {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const found = []
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { node.forEach(walk); return }
    const type = [].concat(node['@type'] || [])
    if (type.some((t) => typeof t === 'string' && /Event$/.test(t))) found.push(node)
    if (node['@graph']) walk(node['@graph'])
    if (node.itemListElement) walk([].concat(node.itemListElement).map((i) => i.item || i))
  }
  for (const [, body] of blocks) {
    try { walk(JSON.parse(body.trim())) } catch { /* ignore malformed blocks */ }
  }
  return found
}

function jsonLdToRaw(node, tz) {
  const start = parseLooseDate(node.startDate, tz)
  if (!start) return null
  if (/Cancelled|Postponed/i.test(String(node.eventStatus || ''))) return null
  const end = node.endDate ? parseLooseDate(node.endDate, tz) : null
  const loc = [].concat(node.location || [])[0] || {}
  const addr = typeof loc.address === 'string' ? { streetAddress: loc.address } : (loc.address || {})
  const offers = [].concat(node.offers || [])
  let price
  if (node.isAccessibleForFree === true || node.isAccessibleForFree === 'true') price = 'free'
  else if (offers.length) {
    const nums = offers.flatMap((o) => [o.price, o.lowPrice, o.highPrice]).filter((p) => p !== undefined && p !== null && p !== '').map(Number).filter((n) => !Number.isNaN(n))
    if (nums.length) price = { min: Math.min(...nums), max: Math.max(...nums) }
  }
  const image = [].concat(node.image || [])[0]
  return {
    uid: node['@id'] || node.url || '',
    title: node.name,
    description: node.description,
    start: start.date,
    end: end ? (end.allDay ? new Date(end.date.getTime() + 86400000 - 1) : end.date) : null,
    allDay: start.allDay,
    venue: loc.name || '',
    address: [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(', '),
    city: addr.addressLocality || '',
    state: addr.addressRegion || '',
    url: node.url || '',
    ticketUrl: offers[0]?.url || '',
    image: typeof image === 'string' ? image : image?.url || '',
    price,
  }
}

async function jsonld(source, ctx) {
  const pages = [].concat(source.url)
  const out = []
  for (const page of pages) {
    await assertRobotsAllows(page)
    const html = await fetchText(page, { headers: { Accept: 'text/html' } })
    for (const node of extractJsonLdEvents(html)) {
      const raw = jsonLdToRaw(node, ctx.tz)
      if (raw) out.push(raw)
    }
  }
  return out
}

// ---------- json (an official JSON API / open-data feed) ----------
export function getPath(obj, path) {
  if (!path) return undefined
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

async function json(source, ctx) {
  const url = source.url.replace(/\{env\.([A-Z0-9_]+)\}/g, (_, k) => {
    if (!process.env[k]) throw new Error(`Missing environment variable ${k}`)
    return encodeURIComponent(process.env[k])
  })
  const data = JSON.parse(await fetchText(url, { headers: { Accept: 'application/json' } }))
  const items = source.itemsPath ? getPath(data, source.itemsPath) : data
  if (!Array.isArray(items)) throw new Error(`itemsPath "${source.itemsPath}" did not point at an array`)
  const f = source.fields || {}
  return items.map((item) => {
    const start = parseLooseDate(getPath(item, f.start || 'start'), ctx.tz)
    if (!start) return null
    const end = f.end ? parseLooseDate(getPath(item, f.end), ctx.tz) : null
    return {
      uid: String(getPath(item, f.id || 'id') ?? ''),
      title: getPath(item, f.title || 'title'),
      description: getPath(item, f.description || 'description'),
      start: start.date,
      end: end ? end.date : null,
      allDay: start.allDay,
      venue: getPath(item, f.venue),
      address: getPath(item, f.address),
      city: getPath(item, f.city),
      state: getPath(item, f.state),
      url: getPath(item, f.url || 'url'),
      image: getPath(item, f.image),
      price: f.price ? getPath(item, f.price) : undefined,
      categories: [].concat(getPath(item, f.categories) || []).map(String),
    }
  }).filter(Boolean)
}

// ---------- ticketmaster (official Discovery API, needs a free API key) ----------
const TM_SEGMENTS = { Music: 'live-music', Sports: 'sports', 'Arts & Theatre': 'arts-theater', Family: 'family', Film: 'arts-theater' }

async function ticketmaster(source, ctx) {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) throw new Error('TICKETMASTER_API_KEY is not set')
  const fmt = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const o = source.options || {}
  const out = []
  const maxPages = o.maxPages || 4
  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      apikey: key,
      latlong: o.latlong || '33.7490,-84.3880',
      radius: String(o.radiusMiles || 50),
      unit: 'miles',
      stateCode: 'GA',
      startDateTime: fmt(ctx.windowStart),
      endDateTime: fmt(ctx.windowEnd),
      size: '200',
      page: String(page),
      sort: 'date,asc',
    })
    const data = JSON.parse(await fetchText(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`))
    const events = data?._embedded?.events || []
    for (const e of events) {
      if (e.dates?.status?.code === 'cancelled' || e.dates?.status?.code === 'postponed') continue
      const st = e.dates?.start || {}
      const start = st.dateTime ? parseLooseDate(st.dateTime, ctx.tz) : parseLooseDate(st.localTime ? `${st.localDate}T${st.localTime}` : st.localDate, ctx.tz)
      if (!start) continue
      const v = e._embedded?.venues?.[0] || {}
      const cls = e.classifications?.[0] || {}
      const pr = e.priceRanges?.[0]
      const img = (e.images || []).filter((i) => i.ratio === '16_9').sort((a, b) => a.width - b.width).find((i) => i.width >= 500) || e.images?.[0]
      out.push({
        uid: e.id,
        title: e.name,
        description: e.info || e.pleaseNote || '',
        start: start.date,
        allDay: start.allDay,
        venue: v.name || '',
        address: [v.address?.line1, v.city?.name, v.state?.stateCode].filter(Boolean).join(', '),
        city: v.city?.name || '',
        state: v.state?.stateCode || '',
        url: e.url,
        ticketUrl: e.url,
        image: img?.url || '',
        price: pr ? { min: pr.min, max: pr.max } : 'paid',
        category: TM_SEGMENTS[cls.segment?.name] || undefined,
        categories: [cls.segment?.name, cls.genre?.name, cls.subGenre?.name].filter((s) => s && s !== 'Undefined'),
      })
    }
    const totalPages = data?.page?.totalPages ?? 0
    if (page + 1 >= totalPages || (page + 1) * 200 >= 1000) break
    await new Promise((r) => setTimeout(r, 300)) // stay well under rate limits
  }
  return out
}

export const ADAPTERS = { ics, jsonld, json, ticketmaster }
