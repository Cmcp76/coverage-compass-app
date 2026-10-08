import { SITE } from './config.js'
import { TIMEZONE, CATEGORIES, categoryById } from './taxonomy.js'
import { zonedToUtc, zonedParts, localDateKey, startOfLocalDay } from './time.js'
import {
  esc, safeUrl, fmt, effectiveEnd, whenText, priceBadge, eventPath,
  DATE_PRESETS, rangeFor, matches, filterEvents, sortResults, listHtml, emptyHtml,
} from './render.js'

const $ = (sel, root = document) => root.querySelector(sel)
const PAGE_SIZE = 60

function readPreset() {
  try { return JSON.parse($('#page-preset')?.textContent || '{}') } catch { return {} }
}
const PRESET = readPreset()
const DEFAULTS = { when: PRESET.when || 'weekend', from: '', to: '', cats: new Set(PRESET.cats || []), city: PRESET.city || '', price: PRESET.price || '', dateNight: !!PRESET.dateNight, q: '' }

const state = { ...DEFAULTS, cats: new Set(DEFAULTS.cats), limit: PAGE_SIZE }
const cal = { month: null, selected: '' } // calendar view
let data = { events: [], sources: [], generatedAt: null }
let loadError = false

// ---------- URL state (only what differs from the page's preset) ----------
function readUrl() {
  const p = new URLSearchParams(location.search)
  if (DATE_PRESETS.some((d) => d.id === p.get('when'))) state.when = p.get('when')
  state.from = p.get('from') || ''
  state.to = p.get('to') || ''
  if (p.has('cat')) state.cats = new Set(p.get('cat').split(',').filter((c) => CATEGORIES.some((x) => x.id === c)))
  if (p.has('city')) state.city = p.get('city')
  if (p.has('price')) state.price = ['free', 'paid'].includes(p.get('price')) ? p.get('price') : ''
  if (p.has('datenight')) state.dateNight = p.get('datenight') === '1'
  state.q = p.get('q') || ''
  if (p.get('day')) cal.selected = p.get('day')
}

function writeUrl() {
  const p = new URLSearchParams()
  const sameCats = [...state.cats].sort().join(',') === [...DEFAULTS.cats].sort().join(',')
  if (state.when !== DEFAULTS.when) p.set('when', state.when)
  if (state.when === 'custom') { if (state.from) p.set('from', state.from); if (state.to) p.set('to', state.to) }
  if (!sameCats) p.set('cat', [...state.cats].join(','))
  if (state.city !== DEFAULTS.city) p.set('city', state.city)
  if (state.price !== DEFAULTS.price) p.set('price', state.price)
  if (state.dateNight !== DEFAULTS.dateNight) p.set('datenight', state.dateNight ? '1' : '0')
  if (state.q) p.set('q', state.q)
  if (PRESET.view === 'calendar' && cal.selected) p.set('day', cal.selected)
  const qs = p.toString()
  history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`)
}

// ---------- filter controls ----------
function renderControls(range) {
  const dateChips = $('#date-chips')
  if (!dateChips) return
  dateChips.innerHTML = DATE_PRESETS.map((d) =>
    `<button type="button" class="chip" data-when="${d.id}" aria-pressed="${state.when === d.id && !cal.selected}">${d.id === 'custom' ? '📅 ' : ''}${d.label}</button>`).join('')
  $('#custom-dates').hidden = state.when !== 'custom'
  $('#from').value = state.from
  $('#to').value = state.to

  const counts = {}
  for (const e of data.events) if (matches(e, range, state, { ignoreCats: true })) counts[e.category] = (counts[e.category] || 0) + 1
  $('#cat-chips').innerHTML = `<button type="button" class="chip" data-cat="" aria-pressed="${state.cats.size === 0}">✨ All</button>` +
    CATEGORIES.map((c) => `<button type="button" class="chip" data-cat="${c.id}" style="--chip-color:${c.color}" aria-pressed="${state.cats.has(c.id)}">${c.emoji} ${esc(c.label)}${counts[c.id] ? ` <span class="count">${counts[c.id]}</span>` : ''}</button>`).join('')

  const citySel = $('#city')
  const known = new Set([...citySel.options].map((o) => o.value || o.textContent))
  for (const name of new Set(data.events.map((e) => e.city))) {
    if (!known.has(name)) citySel.add(new Option(name, name))
  }
  citySel.value = state.city
  for (const b of $('#price').querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.price === state.price))
  $('#date-night').checked = state.dateNight
  if (document.activeElement !== $('#q')) $('#q').value = state.q
}

// ---------- results ----------
function adSlotHtml() {
  return '<div class="ad-slot ad-infeed" data-ad="inFeed"></div>'
}

function currentRange(now) {
  if (PRESET.view === 'calendar' && cal.selected) {
    const [y, m, d] = cal.selected.split('-').map(Number)
    const start = zonedToUtc(y, m, d, 0, 0, 0, TIMEZONE)
    return { start: start < now ? now : start, end: zonedToUtc(y, m, d + 1, 0, 0, 0, TIMEZONE) }
  }
  return rangeFor(state, now)
}

function render() {
  const list = $('#event-list')
  if (!list) return
  const now = new Date()
  const range = currentRange(now)
  renderControls(range)
  const sorted = sortResults(data.events.filter((e) => matches(e, range, state)), range)

  const title = PRESET.view === 'calendar' && cal.selected
    ? fmt.long.format(zonedToUtc(...cal.selected.split('-').map(Number), 12, 0, 0, TIMEZONE))
    : (DATE_PRESETS.find((d) => d.id === state.when) || DATE_PRESETS[0]).title
  $('#results-title').textContent = title
  const free = sorted.filter((e) => e.price?.isFree === true).length
  $('#results-count').textContent = data.events.length ? `${sorted.length} event${sorted.length === 1 ? '' : 's'}${free ? ` · ${free} free` : ''}` : ''

  const empty = $('#empty')
  if (!sorted.length) {
    list.innerHTML = ''
    empty.hidden = false
    empty.innerHTML = emptyHtml({ hasAny: data.events.length > 0, error: loadError })
  } else {
    empty.hidden = true
    const adsOn = adsEnabled() && SITE.adsense.slots.inFeed
    list.innerHTML = listHtml(sorted, range, now, { limit: state.limit, adHtml: adsOn ? adSlotHtml() : null, adEvery: Math.max(4, SITE.adsense.inFeedEvery || 8) })
    fillAds(list)
  }
  if (PRESET.view === 'calendar') renderCalendar(now)
}

// ---------- calendar view ----------
function renderCalendar(now) {
  const el = $('#calendar')
  if (!el) return
  const today = zonedParts(now, TIMEZONE)
  if (!cal.month) {
    const base = cal.selected ? cal.selected.split('-').map(Number) : [today.year, today.month]
    cal.month = { y: base[0], m: base[1] }
  }
  const { y, m } = cal.month
  const perDay = {}
  const filters = { ...state, when: 'all' }
  const range = { start: now, end: startOfLocalDay(now, TIMEZONE, 3650) }
  for (const e of data.events) {
    if (!matches(e, range, filters)) continue
    // Count each day the event runs (capped for long exhibitions).
    let d = new Date(Math.max(new Date(e.start), startOfLocalDay(now, TIMEZONE)))
    const end = effectiveEnd(e)
    for (let i = 0; i < 31 && d < end; i++) {
      const k = localDateKey(d, TIMEZONE)
      perDay[k] = (perDay[k] || 0) + 1
      d = startOfLocalDay(d, TIMEZONE, 1)
    }
  }
  const firstWd = new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const todayKey = localDateKey(now, TIMEZONE)
  let cells = ''
  for (let i = 0; i < firstWd; i++) cells += '<span class="cal-cell empty"></span>'
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const n = perDay[key] || 0
    const past = key < todayKey
    cells += `<button type="button" class="cal-cell${key === todayKey ? ' today' : ''}${key === cal.selected ? ' selected' : ''}${n ? ' has' : ''}" data-day="${key}" ${past ? 'disabled' : ''} aria-label="${fmt.long.format(zonedToUtc(y, m, d, 12, 0, 0, TIMEZONE))}: ${n} events"><span class="cal-num">${d}</span>${n ? `<span class="cal-count">${n}</span>` : ''}</button>`
  }
  const canPrev = y > today.year || (y === today.year && m > today.month)
  el.innerHTML = `<div class="cal-head">
      <button type="button" class="icon-btn" data-cal="prev" aria-label="Previous month" ${canPrev ? '' : 'disabled'}>‹</button>
      <h2>${fmt.month.format(zonedToUtc(y, m, 15, 12, 0, 0, TIMEZONE))}</h2>
      <button type="button" class="icon-btn" data-cal="next" aria-label="Next month">›</button>
    </div>
    <div class="cal-grid">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<span class="cal-wd">${d}</span>`).join('')}${cells}</div>`
}

// ---------- home extras ----------
function renderCounts() {
  const now = new Date()
  for (const el of document.querySelectorAll('[data-count]')) {
    try {
      const n = filterEvents(data.events, JSON.parse(el.dataset.count), now).results.length
      el.textContent = `${n} event${n === 1 ? '' : 's'}`
    } catch { /* leave server-rendered value */ }
  }
}

function renderHeroStats() {
  const el = $('#hero-stats')
  if (!el) return
  const wk = filterEvents(data.events, { when: 'weekend' }).results
  const free = wk.filter((e) => e.price?.isFree === true).length
  const parts = []
  if (wk.length) parts.push(`🎉 ${wk.length} event${wk.length === 1 ? '' : 's'} this weekend`)
  if (free) parts.push(`🆓 ${free} free`)
  if (data.generatedAt) parts.push(`🔄 Updated ${relative(new Date(data.generatedAt))}`)
  el.innerHTML = parts.map((p) => `<span class="stat">${esc(p)}</span>`).join('')
}

function relative(d) {
  const mins = Math.round((Date.now() - d) / 60000)
  if (mins < 60) return 'just now'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return fmt.monthDay.format(d)
}

// ---------- quick-view dialog ----------
function openEvent(id) {
  const e = data.events.find((x) => x.id === id)
  if (!e) return false
  const cat = categoryById(e.category)
  const img = safeUrl(e.image)
  const page = safeUrl(e.url)
  const tickets = safeUrl(e.ticketUrl)
  $('#dialog-body').innerHTML = `
    <button class="dialog-close" type="button" data-action="close" aria-label="Close">✕</button>
    <div class="media" style="--cat:${cat.color}">${img ? `<img src="${esc(img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span aria-hidden="true">${cat.emoji}</span></div>
    <div class="dialog-content" style="--cat:${cat.color}">
      <div class="badges"><span class="badge">${esc(cat.label)}</span>${priceBadge(e)}${e.sponsored ? '<span class="badge featured">Sponsored</span>' : ''}</div>
      <h2 id="dialog-title">${esc(e.title)}</h2>
      <div class="meta"><span>🗓 ${esc(whenText(e))}</span><span>📍 ${esc([e.venue, e.city].filter(Boolean).join(' · '))}</span>${e.price?.text ? `<span>🎟 ${esc(e.price.text)}</span>` : ''}</div>
      ${e.description ? `<p class="desc">${esc(e.description.length > 280 ? `${e.description.slice(0, 280)}…` : e.description)}</p>` : ''}
      <div class="dialog-actions">
        <a class="btn btn-primary" href="${esc(eventPath(e))}">Full details</a>
        ${tickets || page ? `<a class="btn btn-ghost" href="${esc(tickets || page)}" target="_blank" rel="noopener">${tickets ? 'Get tickets ↗' : 'Official page ↗'}</a>` : ''}
        <button class="btn btn-ghost" type="button" data-action="ics" data-id="${esc(e.id)}">＋ Calendar</button>
      </div>
      <p class="muted small">Listed via ${esc(e.source?.name || SITE.name)}. Please confirm details with the organizer before you go.</p>
    </div>`
  const dlg = $('#event-dialog')
  if (!dlg.open) dlg.showModal()
  return true
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
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }))
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

async function shareEvent(e, btn) {
  const url = `${location.origin}${eventPath(e)}`
  try {
    if (navigator.share) { await navigator.share({ title: e.title, text: `${e.title}: ${whenText(e)}`, url }); return }
    await navigator.clipboard.writeText(url)
    btn.textContent = '✓ Link copied'
  } catch { /* cancelled */ }
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
    if (!slot || el.dataset.filled || (el.dataset.ad === 'local' && !el.dataset.noLocal)) continue
    el.hidden = false
    el.dataset.filled = '1'
    el.innerHTML = `<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(SITE.adsense.client)}" data-ad-slot="${esc(slot)}" data-ad-format="${el.dataset.ad === 'inFeed' ? 'fluid' : 'auto'}" data-full-width-responsive="true"></ins>`
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch { /* blocked */ }
  }
}

// Directly sold local business ads from data/local-ads.json.
async function loadLocalAds() {
  const slot = $('.ad-slot[data-ad="local"]')
  if (!slot) return
  // Directly sold ads win; otherwise the spot can fall back to AdSense.
  const fallback = () => { slot.dataset.noLocal = '1'; fillAds(slot.parentElement) }
  try {
    const res = await fetch('/data/local-ads.json', { cache: 'no-cache' })
    if (!res.ok) return fallback()
    const today = localDateKey(new Date(), TIMEZONE)
    const active = ((await res.json()).ads || []).filter((a) =>
      safeUrl(a.url) && a.business && (!a.start || a.start <= today) && (!a.end || a.end >= today)
      && (!a.cities?.length || !state.city || a.cities.includes(state.city)))
    if (!active.length) return fallback()
    const ad = active[Math.floor(Math.random() * active.length)]
    slot.hidden = false
    slot.innerHTML = `<span class="ad-label">Sponsored · Local business</span>
      <a class="local-ad" href="${esc(safeUrl(ad.url))}" target="_blank" rel="sponsored noopener">
        ${safeUrl(ad.image) ? `<img src="${esc(safeUrl(ad.image))}" alt="" loading="lazy">` : ''}
        <span><strong>${esc(ad.business)}</strong><span>${esc(ad.text || '')}</span></span>
      </a>`
  } catch { fallback() }
}

// ---------- analytics (optional, see config.js) ----------
function loadAnalytics() {
  const a = SITE.analytics || {}
  if (a.provider === 'cloudflare' && a.id) {
    const s = document.createElement('script')
    s.defer = true
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    s.dataset.cfBeacon = JSON.stringify({ token: a.id })
    document.head.appendChild(s)
  } else if (a.provider === 'ga4' && /^G-[A-Z0-9]+$/.test(a.id || '')) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${a.id}`
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', a.id)
  }
}

// ---------- forms (event submission + advertising inquiry) ----------
function setupForms() {
  for (const form of document.querySelectorAll('form[data-gwf-form]')) {
    const status = form.querySelector('.form-status')
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      status.className = 'form-status'
      const fd = new FormData(form)
      if (fd.get('bot-field')) return
      const fail = (msg) => { status.className = 'form-status err'; status.textContent = msg }
      if (fd.get('end_date') && fd.get('end_date') < fd.get('start_date')) return fail('The end date is before the start date.')
      if (fd.get('start_date') && fd.get('start_date') < localDateKey(new Date(), TIMEZONE)) return fail('That start date has already passed.')
      if (fd.get('price_type') === 'paid' && !fd.get('price')) return fail('Please add the ticket price for paid events.')
      const btn = form.querySelector('button[type="submit"]')
      btn.disabled = true
      status.textContent = 'Sending…'
      try {
        const provider = SITE.submissions.provider
        if (provider === 'email') {
          const body = [...fd.entries()].filter(([k]) => !['form-name', 'bot-field'].includes(k)).map(([k, v]) => `${k}: ${v}`).join('\n')
          location.href = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`${fd.get('form-name')}: ${fd.get('title') || fd.get('business') || ''}`)}&body=${encodeURIComponent(body)}`
          status.className = 'form-status ok'
          status.textContent = 'Your email app should open with the details. Just press send.'
          return
        }
        const res = provider === 'formspree' && SITE.submissions.formspreeId
          ? await fetch(`https://formspree.io/f/${encodeURIComponent(SITE.submissions.formspreeId)}`, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
          : await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fd).toString() })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        form.reset()
        status.className = 'form-status ok'
        status.textContent = 'Thanks! It’s in our review queue. We’ll email you if we have questions.'
      } catch {
        status.className = 'form-status err'
        status.innerHTML = `Sorry, that didn't go through. Please email <a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a>.`
      } finally {
        btn.disabled = false
      }
    })
  }
}

// ---------- theme ----------
function setupTheme() {
  const root = document.documentElement
  try { const saved = localStorage.getItem('gwf-theme'); if (saved) root.dataset.theme = saved } catch { /* blocked */ }
  $('#theme-toggle')?.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    try { localStorage.setItem('gwf-theme', root.dataset.theme) } catch { /* blocked */ }
  })
}

// ---------- events ----------
function update(changes) {
  Object.assign(state, changes, { limit: PAGE_SIZE })
  if ('when' in changes || 'from' in changes || 'to' in changes) cal.selected = ''
  writeUrl()
  render()
}

function bind() {
  const on = (sel, type, fn) => $(sel)?.addEventListener(type, fn)
  on('#date-chips', 'click', (ev) => { const b = ev.target.closest('[data-when]'); if (b) update({ when: b.dataset.when }) })
  on('#from', 'change', (ev) => update({ from: ev.target.value }))
  on('#to', 'change', (ev) => update({ to: ev.target.value }))
  on('#cat-chips', 'click', (ev) => {
    const b = ev.target.closest('[data-cat]')
    if (!b) return
    const cats = new Set(state.cats)
    if (!b.dataset.cat) cats.clear()
    else if (cats.has(b.dataset.cat)) cats.delete(b.dataset.cat)
    else cats.add(b.dataset.cat)
    update({ cats })
  })
  on('#city', 'change', (ev) => update({ city: ev.target.value }))
  on('#price', 'click', (ev) => { const b = ev.target.closest('[data-price]'); if (b) update({ price: b.dataset.price }) })
  on('#date-night', 'change', (ev) => update({ dateNight: ev.target.checked }))
  let t
  on('#q', 'input', (ev) => { clearTimeout(t); t = setTimeout(() => update({ q: ev.target.value.trim() }), 300) })
  on('#clear-filters', 'click', () => update({ cats: new Set(), city: '', price: '', q: '', dateNight: false }))
  on('#more-toggle', 'click', (ev) => {
    const open = $('#more-filters').classList.toggle('open')
    ev.currentTarget.setAttribute('aria-expanded', String(open))
  })
  on('#calendar', 'click', (ev) => {
    const nav = ev.target.closest('[data-cal]')
    if (nav) {
      let { y, m } = cal.month
      m += nav.dataset.cal === 'next' ? 1 : -1
      if (m > 12) { m = 1; y++ } else if (m < 1) { m = 12; y-- }
      cal.month = { y, m }
      renderCalendar(new Date())
      return
    }
    const day = ev.target.closest('[data-day]')
    if (day) {
      cal.selected = cal.selected === day.dataset.day ? '' : day.dataset.day
      state.limit = PAGE_SIZE
      writeUrl()
      render()
      if (cal.selected) $('#results')?.scrollIntoView({ behavior: 'smooth' })
    }
  })

  document.addEventListener('click', (ev) => {
    const opener = ev.target.closest('[data-open]')
    const plainClick = ev.button === 0 && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey
    if (opener && plainClick && $('#event-dialog')) {
      if (openEvent(opener.dataset.open)) ev.preventDefault()
      return
    }
    const card = ev.target.closest('.event-card')
    if (card && !ev.target.closest('a') && plainClick) { card.querySelector('[data-open]')?.click(); return }
    const act = ev.target.closest('[data-action]')
    if (!act) return
    const e = data.events.find((x) => x.id === act.dataset.id)
    switch (act.dataset.action) {
      case 'clear': update({ cats: new Set(), city: '', price: '', q: '', dateNight: false }); break
      case 'all': update({ when: 'all', cats: new Set(), city: '', price: '', q: '', dateNight: false }); break
      case 'more': state.limit += PAGE_SIZE; render(); break
      case 'close': $('#event-dialog').close(); break
      case 'ics': if (e) downloadIcs(e); break
      case 'share': if (e) shareEvent(e, act); break
    }
  })
  const dlg = $('#event-dialog')
  dlg?.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close() })
}

async function init() {
  setupTheme()
  setupForms()
  loadAnalytics()
  readUrl()
  bind()
  loadAdSense()
  fillAds()
  try {
    const res = await fetch('/data/events.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data = await res.json()
    data.events = Array.isArray(data.events) ? data.events : []
  } catch (err) {
    console.error('Could not load events', err)
    loadError = true
  }
  renderCounts()
  renderHeroStats()
  render()
  loadLocalAds()
}

init()
