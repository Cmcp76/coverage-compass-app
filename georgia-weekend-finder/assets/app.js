import { SITE } from './config.js'
import { TIMEZONE, CATEGORIES, CITIES, OTHER_CITY, categoryById } from './taxonomy.js'
import { zonedToUtc, startOfLocalDay, localDateKey, weekendRange } from './time.js'

const $ = (sel, root = document) => root.querySelector(sel)
const PAGE_SIZE = 60

const DATE_PRESETS = [
  { id: 'weekend', label: 'This Weekend', title: 'This weekend' },
  { id: 'today', label: 'Today', title: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow', title: 'Tomorrow' },
  { id: 'week', label: 'Next 7 Days', title: 'The next 7 days' },
  { id: 'month', label: 'Next 30 Days', title: 'The next 30 days' },
  { id: 'all', label: 'All Upcoming', title: 'All upcoming events' },
  { id: 'custom', label: 'Pick Dates', title: 'Your dates' },
]

const state = { when: 'weekend', from: '', to: '', cats: new Set(), city: '', price: '', q: '', limit: PAGE_SIZE }
let data = { events: [], sources: [], generatedAt: null }
let loadError = false

// ---------- helpers ----------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function safeUrl(u) {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}

const fmt = {
  time: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' }),
  day: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'long' }),
  short: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' }),
  monthDay: new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, month: 'short', day: 'numeric' }),
}

function effectiveEnd(e) {
  if (e.end) return new Date(e.end)
  const s = new Date(e.start)
  return new Date(s.getTime() + (e.allDay ? 86400000 - 1 : 2 * 3600000))
}

function whenText(e) {
  const s = new Date(e.start)
  const end = e.end ? new Date(e.end) : null
  const multiDay = end && localDateKey(s, TIMEZONE) !== localDateKey(new Date(end.getTime() - 1), TIMEZONE)
  if (multiDay) return `${fmt.short.format(s)} – ${fmt.short.format(new Date(end.getTime() - (e.allDay ? 1 : 0)))}`
  if (e.allDay) return `${fmt.short.format(s)} · All day`
  return `${fmt.short.format(s)} · ${fmt.time.format(s)}${end ? ` – ${fmt.time.format(end)}` : ''}`
}

function priceBadge(e) {
  if (e.price?.isFree === true) return '<span class="badge free">Free</span>'
  if (e.price?.text) return `<span class="badge price">${esc(e.price.text)}</span>`
  if (e.price?.isFree === false) return '<span class="badge price">Tickets</span>'
  return ''
}

function dateInputToUtc(value, addDays = 0) {
  const [y, m, d] = value.split('-').map(Number)
  return zonedToUtc(y, m, d + addDays, 0, 0, 0, TIMEZONE)
}

function currentRange(now = new Date()) {
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

function matches(e, range, { ignoreCats = false } = {}) {
  const s = new Date(e.start)
  if (s >= range.end || effectiveEnd(e) < range.start) return false
  if (!ignoreCats && state.cats.size && !state.cats.has(e.category)) return false
  if (state.city && e.city !== state.city) return false
  if (state.price === 'free' && e.price?.isFree !== true) return false
  if (state.price === 'paid' && e.price?.isFree !== false) return false
  if (state.q) {
    const hay = `${e.title} ${e.venue} ${e.city} ${e.description} ${categoryById(e.category).label}`.toLowerCase()
    if (!state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

// ---------- URL state ----------
function readUrl() {
  const p = new URLSearchParams(location.search)
  if (DATE_PRESETS.some((d) => d.id === p.get('when'))) state.when = p.get('when')
  state.from = p.get('from') || ''
  state.to = p.get('to') || ''
  state.cats = new Set((p.get('cat') || '').split(',').filter((c) => CATEGORIES.some((x) => x.id === c)))
  state.city = p.get('city') || ''
  state.price = ['free', 'paid'].includes(p.get('price')) ? p.get('price') : ''
  state.q = p.get('q') || ''
}

function writeUrl() {
  const p = new URLSearchParams()
  if (state.when !== 'weekend') p.set('when', state.when)
  if (state.when === 'custom') { if (state.from) p.set('from', state.from); if (state.to) p.set('to', state.to) }
  if (state.cats.size) p.set('cat', [...state.cats].join(','))
  if (state.city) p.set('city', state.city)
  if (state.price) p.set('price', state.price)
  if (state.q) p.set('q', state.q)
  const qs = p.toString()
  history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`)
}

// ---------- rendering ----------
function renderDateChips() {
  $('#date-chips').innerHTML = DATE_PRESETS.map((d) =>
    `<button type="button" class="chip" data-when="${d.id}" aria-pressed="${state.when === d.id}">${d.id === 'custom' ? '📅 ' : ''}${d.label}</button>`).join('')
  $('#custom-dates').hidden = state.when !== 'custom'
  $('#from').value = state.from
  $('#to').value = state.to
}

function renderCategoryChips(range) {
  const counts = {}
  for (const e of data.events) if (matches(e, range, { ignoreCats: true })) counts[e.category] = (counts[e.category] || 0) + 1
  const all = `<button type="button" class="chip" data-cat="" aria-pressed="${state.cats.size === 0}">✨ All</button>`
  $('#cat-chips').innerHTML = all + CATEGORIES.map((c) =>
    `<button type="button" class="chip" data-cat="${c.id}" style="--chip-color:${c.color}" aria-pressed="${state.cats.has(c.id)}">${c.emoji} ${esc(c.label)}${counts[c.id] ? ` <span class="count">${counts[c.id]}</span>` : ''}</button>`).join('')
}

function renderCityOptions() {
  const fromData = new Set(data.events.map((e) => e.city))
  const names = [...new Set([...CITIES.map((c) => c.name), ...fromData])]
    .filter((n) => n !== OTHER_CITY).sort((a, b) => (a === 'Atlanta' ? -1 : b === 'Atlanta' ? 1 : a.localeCompare(b)))
  if (fromData.has(OTHER_CITY)) names.push(OTHER_CITY)
  $('#city').innerHTML = '<option value="">All cities</option>' + names.map((n) => `<option ${n === state.city ? 'selected' : ''}>${esc(n)}</option>`).join('')
}

function renderPrice() {
  for (const b of $('#price').querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.price === state.price))
}

function cardHtml(e) {
  const cat = categoryById(e.category)
  const img = safeUrl(e.image)
  return `<article class="event-card${e.featured || e.sponsored ? ' is-featured' : ''}" style="--cat:${cat.color}">
    <div class="media">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span aria-hidden="true">${cat.emoji}</span></div>
    <div class="body">
      <div class="badges"><span class="badge">${esc(cat.label)}</span>${priceBadge(e)}${e.sponsored ? '<span class="badge featured">Sponsored</span>' : e.featured ? '<span class="badge featured">Featured</span>' : ''}</div>
      <h3><a href="#event-${esc(e.id)}" data-open="${esc(e.id)}">${esc(e.title)}</a></h3>
      <div class="meta"><span>🗓 ${esc(whenText(e))}</span>${e.venue || e.city ? `<span>📍 ${esc([e.venue, e.city].filter(Boolean).join(' · '))}</span>` : ''}</div>
      <div class="via">via ${esc(e.source?.name || 'Georgia Weekend Finder')}</div>
    </div>
  </article>`
}

function dayHeading(key, now) {
  const today = localDateKey(now, TIMEZONE)
  const tomorrow = localDateKey(startOfLocalDay(now, TIMEZONE, 1), TIMEZONE)
  const [y, m, d] = key.split('-').map(Number)
  const noon = zonedToUtc(y, m, d, 12, 0, 0, TIMEZONE)
  const name = key === today ? 'Today' : key === tomorrow ? 'Tomorrow' : fmt.day.format(noon)
  return `<h3 class="day-label">${name} <small>${fmt.monthDay.format(noon)}</small></h3>`
}

function adHtml(kind) {
  return `<div class="ad-slot ad-infeed" data-ad="${kind}" data-dynamic="1"></div>`
}

function render() {
  const now = new Date()
  const range = currentRange(now)
  renderDateChips()
  renderCategoryChips(range)
  renderPrice()
  $('#q').value = state.q

  const results = data.events.filter((e) => matches(e, range))
    .sort((a, b) => Math.max(new Date(a.start), range.start) - Math.max(new Date(b.start), range.start)
      || (b.featured || b.sponsored ? 1 : 0) - (a.featured || a.sponsored ? 1 : 0)
      || a.title.localeCompare(b.title))

  const preset = DATE_PRESETS.find((d) => d.id === state.when)
  $('#results-title').textContent = preset.title
  const free = results.filter((e) => e.price?.isFree === true).length
  $('#results-count').textContent = data.events.length
    ? `${results.length} event${results.length === 1 ? '' : 's'}${free ? ` · ${free} free` : ''}`
    : ''

  const list = $('#event-list')
  const empty = $('#empty')
  if (!results.length) {
    list.innerHTML = ''
    empty.hidden = false
    empty.innerHTML = loadError
      ? `<div class="big">⚠️</div><h3>We couldn’t load events right now</h3><p>Please refresh in a moment.</p>`
      : data.events.length
      ? `<div class="big">🔍</div><h3>Nothing matches those filters</h3><p>Try a wider date range, another city, or fewer categories.</p>
         <button class="btn btn-primary" type="button" data-action="clear">Clear filters</button> <button class="btn btn-ghost" type="button" data-action="all">See all upcoming</button>`
      : `<div class="big">🍑</div><h3>Fresh listings are on the way</h3><p>We only publish events from approved sources and reviewed submissions, so the calendar fills up as those come in. Hosting something? Be one of the first listed.</p>
         <a class="btn btn-primary" href="#submit">Submit an event</a>`
    return
  }
  empty.hidden = true

  const shown = results.slice(0, state.limit)
  const groups = new Map()
  for (const e of shown) {
    const key = localDateKey(new Date(Math.max(new Date(e.start), range.start)), TIMEZONE)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e)
  }
  const adsOn = adsEnabled() && SITE.adsense.slots.inFeed
  const every = Math.max(4, SITE.adsense.inFeedEvery || 8)
  let n = 0
  let adsPlaced = 0
  let html = ''
  for (const [key, events] of groups) {
    html += `<section class="day-group">${dayHeading(key, now)}<div class="grid">`
    for (const e of events) {
      html += cardHtml(e)
      n++
      if (adsOn && n % every === 0 && adsPlaced < 3) { html += adHtml('inFeed'); adsPlaced++ }
    }
    html += '</div></section>'
  }
  if (results.length > shown.length) {
    html += `<p style="text-align:center;margin-top:24px"><button class="btn btn-ghost" type="button" data-action="more">Show more (${results.length - shown.length} left)</button></p>`
  }
  list.innerHTML = html
  fillAds(list)
  injectStructuredData(results.slice(0, 30))
}

function renderHeroStats() {
  const now = new Date()
  const r = weekendRange(now, TIMEZONE)
  const wk = data.events.filter((e) => new Date(e.start) < r.end && effectiveEnd(e) >= (r.start < now ? now : r.start))
  const free = wk.filter((e) => e.price?.isFree === true).length
  const parts = []
  if (wk.length) parts.push(`🎉 ${wk.length} event${wk.length === 1 ? '' : 's'} this weekend`)
  if (free) parts.push(`🆓 ${free} free`)
  if (data.generatedAt) parts.push(`🔄 Updated ${relative(new Date(data.generatedAt))}`)
  $('#hero-stats').innerHTML = parts.map((p) => `<span class="stat">${esc(p)}</span>`).join('')
}

function relative(d) {
  const mins = Math.round((Date.now() - d) / 60000)
  if (mins < 60) return 'just now'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return fmt.monthDay.format(d)
}

function renderSources() {
  const active = (data.sources || []).filter((s) => s.count > 0)
  $('#source-list').innerHTML = active.length
    ? active.map((s) => {
      const site = safeUrl(s.website)
      return `<li>${site ? `<a href="${esc(site)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name)} · ${s.count}</li>`
    }).join('')
    : '<li>Our first sources are being set up.</li>'
  $('#updated-at').textContent = data.generatedAt
    ? `Last updated ${new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))} ET`
    : ''
}

// ---------- event dialog ----------
function openEvent(id, { push = true } = {}) {
  const e = data.events.find((x) => x.id === id)
  if (!e) return
  const cat = categoryById(e.category)
  const img = safeUrl(e.image)
  const page = safeUrl(e.url)
  const tickets = safeUrl(e.ticketUrl)
  const mapQ = encodeURIComponent([e.venue, e.address || e.city, 'GA'].filter(Boolean).join(', '))
  const src = safeUrl(e.source?.url)
  $('#dialog-body').innerHTML = `
    <button class="dialog-close" type="button" data-action="close" aria-label="Close">✕</button>
    <div class="media" style="--cat:${cat.color}">${img ? `<img src="${esc(img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span aria-hidden="true">${cat.emoji}</span></div>
    <div class="dialog-content" style="--cat:${cat.color}">
      <div class="badges"><span class="badge">${esc(cat.label)}</span>${priceBadge(e)}${e.sponsored ? '<span class="badge featured">Sponsored</span>' : ''}</div>
      <h2 id="dialog-title">${esc(e.title)}</h2>
      <div class="meta">
        <span>🗓 ${esc(whenText(e))}</span>
        ${e.venue || e.address ? `<span>📍 <a href="https://www.google.com/maps/search/?api=1&query=${mapQ}" target="_blank" rel="noopener">${esc([e.venue, e.address && e.address !== e.venue ? e.address : e.city].filter(Boolean).join(' — '))}</a></span>` : `<span>📍 ${esc(e.city)}</span>`}
        ${e.price?.text ? `<span>🎟 ${esc(e.price.text)}</span>` : ''}
      </div>
      ${e.description ? `<p class="desc">${esc(e.description)}</p>` : ''}
      <div class="dialog-actions">
        ${tickets && tickets !== page ? `<a class="btn btn-primary" href="${esc(tickets)}" target="_blank" rel="noopener">Get tickets</a>` : ''}
        ${page ? `<a class="btn ${tickets && tickets !== page ? 'btn-ghost' : 'btn-primary'}" href="${esc(page)}" target="_blank" rel="noopener">${e.price?.isFree === false && !tickets ? 'Get tickets' : 'Official event page'}</a>` : ''}
        <button class="btn btn-ghost" type="button" data-action="ics" data-id="${esc(e.id)}">＋ Add to calendar</button>
        <button class="btn btn-ghost" type="button" data-action="share" data-id="${esc(e.id)}">↗ Share</button>
      </div>
      <p class="muted small" style="margin-top:16px">Listed via ${src ? `<a href="${esc(src)}" target="_blank" rel="noopener">${esc(e.source.name)}</a>` : esc(e.source?.name || 'Georgia Weekend Finder')}. Details can change — please confirm with the organizer before you go.</p>
    </div>`
  const dlg = $('#event-dialog')
  if (!dlg.open) dlg.showModal()
  if (push && location.hash !== `#event-${id}`) history.pushState(null, '', `#event-${id}`)
}

function closeDialog() {
  const dlg = $('#event-dialog')
  if (dlg.open) dlg.close()
}

function icsEscape(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function downloadIcs(e) {
  const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const dateOnly = (d) => localDateKey(d, TIMEZONE).replace(/-/g, '')
  const s = new Date(e.start)
  const end = effectiveEnd(e)
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Georgia Weekend Finder//EN', 'BEGIN:VEVENT',
    `UID:${e.id}@georgiaweekendfinder`, `DTSTAMP:${utc(new Date())}`,
    e.allDay ? `DTSTART;VALUE=DATE:${dateOnly(s)}` : `DTSTART:${utc(s)}`,
    e.allDay ? `DTEND;VALUE=DATE:${dateOnly(new Date(end.getTime() + 1))}` : `DTEND:${utc(end)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `LOCATION:${icsEscape([e.venue, e.address || e.city].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${icsEscape(`${e.description || ''}\n\n${e.url || ''}`.trim())}`,
    e.url ? `URL:${e.url}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean)
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

async function shareEvent(e, btn) {
  const url = `${location.origin}${location.pathname}#event-${e.id}`
  try {
    if (navigator.share) { await navigator.share({ title: e.title, text: `${e.title} — ${whenText(e)}`, url }); return }
    await navigator.clipboard.writeText(url)
    btn.textContent = '✓ Link copied'
  } catch { /* user cancelled */ }
}

// ---------- structured data for search engines ----------
function injectStructuredData(events) {
  let tag = document.getElementById('events-jsonld')
  if (!tag) {
    tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.id = 'events-jsonld'
    document.head.appendChild(tag)
  }
  const items = events.filter((e) => e.venue || e.address).map((e) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: e.start,
    ...(e.end ? { endDate: e.end } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: e.venue || e.city, address: { '@type': 'PostalAddress', streetAddress: e.address || '', addressLocality: e.city, addressRegion: 'GA', addressCountry: 'US' } },
    ...(e.description ? { description: e.description } : {}),
    ...(safeUrl(e.image) ? { image: [e.image] } : {}),
    ...(safeUrl(e.url) ? { url: e.url } : {}),
    ...(e.price?.isFree === true ? { isAccessibleForFree: true } : {}),
  }))
  tag.textContent = JSON.stringify(items).replace(/</g, '\\u003c')
}

// ---------- ads ----------
function adsEnabled() {
  return SITE.adsense.enabled && /^ca-pub-\d+$/.test(SITE.adsense.client)
}

function loadAdSense() {
  if (!adsEnabled() || document.getElementById('adsense-js')) return
  const s = document.createElement('script')
  s.id = 'adsense-js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(SITE.adsense.client)}`
  document.head.appendChild(s)
}

function fillAds(root = document) {
  if (!adsEnabled()) return
  for (const el of root.querySelectorAll('.ad-slot[data-ad]')) {
    const slot = SITE.adsense.slots[el.dataset.ad]
    if (!slot || el.dataset.filled) continue
    el.hidden = false
    el.dataset.filled = '1'
    el.innerHTML = `<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(SITE.adsense.client)}" data-ad-slot="${esc(slot)}" data-ad-format="${el.dataset.ad === 'inFeed' ? 'fluid' : 'auto'}" data-full-width-responsive="true"></ins>`
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch { /* ad blockers */ }
  }
}

// ---------- submission form ----------
function setupForm() {
  const citySel = $('#submit-city')
  citySel.innerHTML += CITIES.map((c) => `<option>${esc(c.name)}</option>`).join('') + `<option value="${OTHER_CITY}">Other Georgia city (put it in the address)</option>`
  $('#submit-category').innerHTML += CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')

  const form = $('#submit-form')
  const status = $('#form-status')
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    status.className = 'form-status'
    const fd = new FormData(form)
    if (fd.get('bot-field')) return
    if (fd.get('end_date') && fd.get('end_date') < fd.get('start_date')) {
      status.className = 'form-status err'
      status.textContent = 'The end date is before the start date.'
      return
    }
    if (fd.get('price_type') === 'paid' && !fd.get('price')) {
      status.className = 'form-status err'
      status.textContent = 'Please add the ticket price for paid events.'
      return
    }
    const btn = form.querySelector('button[type="submit"]')
    btn.disabled = true
    status.textContent = 'Sending…'
    try {
      const provider = SITE.submissions.provider
      if (provider === 'email') {
        const body = [...fd.entries()].filter(([k]) => !['form-name', 'bot-field'].includes(k)).map(([k, v]) => `${k}: ${v}`).join('\n')
        location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`Event submission: ${fd.get('title')}`)}&body=${encodeURIComponent(body)}`
        status.className = 'form-status ok'
        status.textContent = 'Your email app should open with the details — just press send.'
        return
      }
      let res
      if (provider === 'formspree' && SITE.submissions.formspreeId) {
        res = await fetch(`https://formspree.io/f/${encodeURIComponent(SITE.submissions.formspreeId)}`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      } else {
        res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      form.reset()
      status.className = 'form-status ok'
      status.textContent = 'Thanks! Your event is in our review queue. We’ll email you if we have questions.'
    } catch {
      status.className = 'form-status err'
      status.innerHTML = `Sorry, that didn't go through. Please email the details to <a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a>.`
    } finally {
      btn.disabled = false
    }
  })
}

// ---------- theme ----------
function setupTheme() {
  const root = document.documentElement
  try {
    const saved = localStorage.getItem('gwf-theme')
    if (saved) root.dataset.theme = saved
  } catch { /* storage blocked */ }
  $('#theme-toggle').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    try { localStorage.setItem('gwf-theme', root.dataset.theme) } catch { /* storage blocked */ }
  })
}

// ---------- events ----------
function update(changes) {
  Object.assign(state, changes, { limit: PAGE_SIZE })
  writeUrl()
  render()
}

function bind() {
  $('#date-chips').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-when]')
    if (b) update({ when: b.dataset.when })
  })
  $('#from').addEventListener('change', (ev) => update({ from: ev.target.value }))
  $('#to').addEventListener('change', (ev) => update({ to: ev.target.value }))
  $('#cat-chips').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-cat]')
    if (!b) return
    const cats = new Set(state.cats)
    if (!b.dataset.cat) cats.clear()
    else if (cats.has(b.dataset.cat)) cats.delete(b.dataset.cat)
    else cats.add(b.dataset.cat)
    update({ cats })
  })
  $('#city').addEventListener('change', (ev) => update({ city: ev.target.value }))
  $('#price').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-price]')
    if (b) update({ price: b.dataset.price })
  })
  let t
  $('#q').addEventListener('input', (ev) => { clearTimeout(t); t = setTimeout(() => update({ q: ev.target.value.trim() }), 300) })
  $('#hero-search').addEventListener('submit', (ev) => {
    ev.preventDefault()
    clearTimeout(t)
    update({ q: $('#q').value.trim() })
    $('#results').scrollIntoView()
  })
  $('#clear-filters').addEventListener('click', () => update({ cats: new Set(), city: '', price: '', q: '' }))
  $('#more-toggle').addEventListener('click', (ev) => {
    const open = $('#more-filters').classList.toggle('open')
    ev.currentTarget.setAttribute('aria-expanded', String(open))
  })

  document.addEventListener('click', (ev) => {
    const opener = ev.target.closest('[data-open]')
    if (opener) { ev.preventDefault(); openEvent(opener.dataset.open); return }
    const card = ev.target.closest('.event-card')
    if (card && !ev.target.closest('a')) { openEvent(card.querySelector('[data-open]').dataset.open); return }
    const act = ev.target.closest('[data-action]')
    if (!act) return
    const e = data.events.find((x) => x.id === act.dataset.id)
    switch (act.dataset.action) {
      case 'clear': update({ cats: new Set(), city: '', price: '', q: '' }); break
      case 'all': update({ when: 'all', cats: new Set(), city: '', price: '', q: '' }); break
      case 'more': state.limit += PAGE_SIZE; render(); break
      case 'close': closeDialog(); break
      case 'ics': if (e) downloadIcs(e); break
      case 'share': if (e) shareEvent(e, act); break
    }
  })
  const dlg = $('#event-dialog')
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) closeDialog() })
  dlg.addEventListener('close', () => {
    if (location.hash.startsWith('#event-')) history.replaceState(null, '', location.pathname + location.search)
  })
  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#event-(.+)$/)
    if (m) openEvent(m[1], { push: false })
    else closeDialog()
  })
}

async function init() {
  $('#year').textContent = new Date().getFullYear()
  const contact = $('#contact-link')
  contact.href = `mailto:${SITE.contactEmail}`
  setupTheme()
  setupForm()
  readUrl()
  bind()
  loadAdSense()
  fillAds()
  $('#event-list').innerHTML = '<div class="grid">' + '<div class="skeleton"></div>'.repeat(6) + '</div>'
  try {
    const res = await fetch('data/events.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data = await res.json()
    data.events = Array.isArray(data.events) ? data.events : []
  } catch (err) {
    console.error('Could not load events', err)
    loadError = true
  }
  renderCityOptions()
  renderHeroStats()
  renderSources()
  render()
  const m = location.hash.match(/^#event-(.+)$/)
  if (m) openEvent(m[1], { push: false })
}

init()
