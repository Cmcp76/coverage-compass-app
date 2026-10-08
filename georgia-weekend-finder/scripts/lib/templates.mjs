// HTML templates for every page the builder generates. Plain template
// strings, no framework, so pages stay fast and easy to edit.
import { SITE } from '../../assets/config.js'
import { CATEGORIES, ACTIVE_CITIES, categoryById, OTHER_CITY } from '../../assets/taxonomy.js'
import { CORE_SECTIONS, CATEGORY_PAGES, CITY_PAGES, CALENDAR_PAGE, categoryPageFor } from '../../assets/sections.js'
import { esc, safeUrl, whenText, priceLabel, priceBadge, eventPath, cardHtml, eventJsonLd, jsonLdScript } from '../../assets/render.js'

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700&display=swap'
const siteUrl = () => SITE.url.replace(/\/$/, '')

const BRAND_SVG = '<svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ff4d6d"/></linearGradient></defs><circle cx="20" cy="22" r="15" fill="url(#pg)"/><path d="M20 8c4-6 11-5 13-3-3 3-8 5-13 3z" fill="#2ec4b6"/><path d="M20 9c-2 6-2 20 0 27" stroke="#c9184a" stroke-width="1.6" fill="none" opacity=".45"/></svg>'

const PRIMARY_NAV = [...CORE_SECTIONS, CALENDAR_PAGE]
const LAUNCH_CITY_PAGES = CITY_PAGES.filter((p) => p.launch && !p.cityFree)

function navLink(p, current) {
  return `<a href="${p.path}"${p.path === current ? ' aria-current="page"' : ''}>${esc(p.nav)}</a>`
}

function header(current) {
  const explore = `<div class="menu-cols">
      <div><p class="menu-title">Categories</p>${CATEGORY_PAGES.map((p) => `<a href="${p.path}">${p.emoji} ${esc(p.nav)}</a>`).join('')}</div>
      <div><p class="menu-title">Cities</p>${LAUNCH_CITY_PAGES.map((p) => `<a href="${p.path}">${esc(p.nav)}</a>`).join('')}<a href="/cities/">All cities →</a></div>
    </div>`
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="${esc(SITE.name)} home">${BRAND_SVG}<span>Georgia <b>Weekend</b> Finder</span></a>
    <nav class="nav" aria-label="Main">
      ${PRIMARY_NAV.map((p) => navLink(p, current)).join('')}
      <details class="dropdown"><summary>Explore</summary><div class="menu">${explore}</div></details>
    </nav>
    <div class="header-actions">
      <a class="btn btn-primary btn-sm hide-sm" href="/submit/">Submit event</a>
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle dark mode">🌙</button>
      <details class="mobile-menu"><summary class="icon-btn" aria-label="Open menu">☰</summary>
        <div class="mobile-panel">
          <p class="menu-title">When</p>${PRIMARY_NAV.map((p) => `<a href="${p.path}">${p.emoji} ${esc(p.nav)}</a>`).join('')}
          ${explore}
          <p class="menu-title">More</p><a href="/submit/">Submit an event</a><a href="/advertise/">Advertise with us</a>
        </div>
      </details>
    </div>
  </div>
</header>`
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div><a class="brand" href="/">${BRAND_SVG}<span>Georgia <b>Weekend</b> Finder</span></a>
      <p class="muted small">Things to do around Atlanta and Georgia, from approved sources and reviewed submissions. Always confirm details with the organizer.</p></div>
    <nav aria-label="When"><p class="menu-title">Find events</p>${PRIMARY_NAV.map((p) => `<a href="${p.path}">${esc(p.nav)}</a>`).join('')}</nav>
    <nav aria-label="Categories"><p class="menu-title">Categories</p>${CATEGORY_PAGES.map((p) => `<a href="${p.path}">${esc(p.nav)}</a>`).join('')}</nav>
    <nav aria-label="Cities"><p class="menu-title">Cities</p>${LAUNCH_CITY_PAGES.map((p) => `<a href="${p.path}">${esc(p.nav)}</a>`).join('')}<a href="/cities/">All cities</a></nav>
    <nav aria-label="About"><p class="menu-title">About</p><a href="/submit/">Submit an event</a><a href="/advertise/">Advertise with us</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="mailto:${esc(SITE.contactEmail)}">Contact</a></nav>
  </div>
  <div class="wrap footer-base"><p>© <span id="year">${new Date().getFullYear()}</span> ${esc(SITE.name)} · Made in Georgia 🍑</p></div>
</footer>`
}

export function layout({ path, title, description, body, preset = {}, jsonld = [], noindex = false, ogType = 'website', image = '' }) {
  const canonical = `${siteUrl()}${path}`
  const og = safeUrl(image) || `${siteUrl()}/assets/og-image.svg`
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
  <meta name="theme-color" content="#ff6b4a">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(og)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="module" src="/assets/app.js"></script>
  <script id="page-preset" type="application/json">${JSON.stringify(preset).replace(/</g, '\\u003c')}</script>
  ${jsonld.map(jsonLdScript).join('\n  ')}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${header(path)}
  <main id="main">
${body}
  </main>
  ${footer()}
  <dialog id="event-dialog" class="event-dialog" aria-labelledby="dialog-title"><div class="dialog-body" id="dialog-body"></div></dialog>
</body>
</html>
`
}

// ---------- shared blocks ----------
function filtersHtml() {
  const cityOptions = ACTIVE_CITIES.map((c) => c.name).sort((a, b) => (a === 'Atlanta' ? -1 : b === 'Atlanta' ? 1 : a.localeCompare(b)))
  return `<section class="filters" aria-label="Filter events">
    <div class="wrap">
      <div class="chip-row" role="group" aria-label="When" id="date-chips"></div>
      <div class="custom-dates" id="custom-dates" hidden>
        <label>From <input type="date" id="from"></label>
        <label>To <input type="date" id="to"></label>
      </div>
      <div class="chip-row cats" role="group" aria-label="Category" id="cat-chips"></div>
      <div class="filter-bar">
        <button class="btn btn-ghost more-toggle" type="button" id="more-toggle" aria-expanded="false" aria-controls="more-filters">More filters</button>
        <div class="more-filters" id="more-filters">
          <label class="field"><span>City</span>
            <select id="city"><option value="">All cities</option>${cityOptions.map((n) => `<option>${esc(n)}</option>`).join('')}<option>${OTHER_CITY}</option></select>
          </label>
          <div class="field"><span id="price-label">Price</span>
            <div class="segmented" role="radiogroup" aria-labelledby="price-label" id="price">
              <button type="button" role="radio" data-price="">All</button><button type="button" role="radio" data-price="free">Free</button><button type="button" role="radio" data-price="paid">Paid</button>
            </div>
          </div>
          <label class="check-inline"><input type="checkbox" id="date-night"> 💕 Date night picks</label>
          <label class="field search-field"><span class="sr-only">Search</span><input type="search" id="q" placeholder="Search events…" autocomplete="off"></label>
          <button class="btn btn-link" type="button" id="clear-filters">Clear all</button>
        </div>
      </div>
    </div>
  </section>`
}

function resultsHtml({ heading, listHtml, count, emptyHtml }) {
  return `<div class="wrap"><div class="ad-slot ad-top" data-ad="top" hidden></div></div>
    <section class="results wrap" id="results" tabindex="-1">
      <div class="results-head"><h2 id="results-title">${esc(heading)}</h2><p class="muted" id="results-count" aria-live="polite">${count ? `${count} event${count === 1 ? '' : 's'}` : ''}</p></div>
      <div id="event-list" class="event-list">${listHtml}</div>
      <div id="empty" class="empty"${listHtml ? ' hidden' : ''}>${listHtml ? '' : emptyHtml}</div>
      <div class="ad-slot ad-local" data-ad="local" hidden></div>
    </section>`
}

function pageHero({ eyebrow, h1, description, intro }) {
  return `<section class="hero hero-sm"><div class="wrap">
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1>${esc(h1)}</h1>
      <p class="lede">${esc(intro || description)}</p>
    </div></section>`
}

function exploreMore(exclude) {
  const chip = (p) => (p.path === exclude ? '' : `<a class="chip" href="${p.path}">${p.emoji ? `${p.emoji} ` : ''}${esc(p.nav)}</a>`)
  return `<section class="explore wrap" aria-label="Explore more">
      <h2>Explore more</h2>
      <div class="chip-wrap">${[...CORE_SECTIONS, CALENDAR_PAGE].map(chip).join('')}</div>
      <div class="chip-wrap">${CATEGORY_PAGES.map(chip).join('')}</div>
      <div class="chip-wrap">${LAUNCH_CITY_PAGES.map(chip).join('')}<a class="chip" href="/cities/">All cities →</a></div>
    </section>
    <section class="cta-band"><div class="wrap cta-inner">
      <div><h2>Hosting an event?</h2><p>List it free. Every submission is reviewed by a real person.</p></div>
      <div class="cta-actions"><a class="btn btn-primary" href="/submit/">Submit an event</a><a class="btn btn-ghost" href="/advertise/">Advertise with us</a></div>
    </div></section>`
}

function crumbs(items) {
  return items.map((c) => (c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : esc(c.label))).join(' <span aria-hidden="true">›</span> ')
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href ? { item: `${siteUrl()}${c.href}` } : {}) })),
  }
}

// ---------- listing pages (sections, categories, cities) ----------
export function listingPage(page, ctx) {
  const trail = [{ label: 'Home', href: '/' }]
  if (page.city && page.cityFree) trail.push({ label: page.city.name, href: `/${page.city.slug}/` })
  else if (page.city) trail.push({ label: 'Cities', href: '/cities/' })
  trail.push({ label: page.nav })
  const cityBits = page.city && !page.cityFree
    ? `<p class="city-links"><a class="chip" href="/${page.city.slug}/free/">🆓 Free things to do in ${esc(page.city.name)}</a></p>` : ''
  const body = `${pageHero({ eyebrow: crumbs(trail), h1: page.h1, description: page.description, intro: ctx.intro || page.intro })}
    ${cityBits ? `<div class="wrap">${cityBits}</div>` : ''}
    ${filtersHtml()}
    ${resultsHtml({ heading: ctx.heading, listHtml: ctx.listHtml, count: ctx.count, emptyHtml: ctx.emptyHtml })}
    ${exploreMore(page.path)}`
  return layout({
    path: page.path, title: page.title, description: page.description, body, preset: page.preset,
    noindex: ctx.noindex, jsonld: [breadcrumbJsonLd(trail), ...ctx.jsonld],
  })
}

// ---------- home ----------
export function homePage(page, ctx) {
  const tile = (p, count) => `<a class="tile" href="${p.path}"><span class="tile-emoji">${p.emoji}</span><span class="tile-label">${esc(p.nav)}</span><span class="tile-count" data-count='${esc(JSON.stringify(p.preset))}'>${count != null ? `${count} event${count === 1 ? '' : 's'}` : ''}</span></a>`
  const featured = ctx.featured.length
    ? `<section class="wrap featured"><div class="section-head"><h2>⭐ Featured</h2></div><div class="grid">${ctx.featured.map(cardHtml).join('')}</div></section>` : ''
  const body = `<section class="hero">
      <div class="wrap">
        <p class="eyebrow">Atlanta · Decatur · Stone Mountain · Marietta · Sandy Springs · and beyond</p>
        <h1>Your Georgia weekend, <span class="hl">sorted.</span></h1>
        <p class="lede">Concerts, festivals, family days, food events and trail time: free and paid things to do around Atlanta, pulled from approved sources and checked by real people.</p>
        <form class="hero-search" role="search" id="hero-search" action="/this-weekend/">
          <label class="sr-only" for="hero-q">Search events</label>
          <input id="hero-q" name="q" type="search" placeholder="Try “jazz”, “farmers market”, “kids”…" autocomplete="off">
          <button class="btn btn-primary" type="submit">Find events</button>
        </form>
        <div class="hero-stats" id="hero-stats" aria-live="polite"></div>
      </div>
    </section>
    <section class="wrap quick-tiles" aria-label="Browse by time">
      <div class="tiles">${[...CORE_SECTIONS, CALENDAR_PAGE].map((p) => tile(p, ctx.counts[p.key])).join('')}</div>
    </section>
    ${featured}
    <section class="wrap" aria-label="Browse by category">
      <div class="section-head"><h2>Popular activities</h2></div>
      <div class="tiles cat-tiles">${CATEGORY_PAGES.map((p) => tile(p, ctx.counts[p.key])).join('')}</div>
    </section>
    ${filtersHtml()}
    ${resultsHtml({ heading: 'This weekend', listHtml: ctx.listHtml, count: ctx.count, emptyHtml: ctx.emptyHtml })}
    <section class="wrap" aria-label="Browse by city">
      <div class="section-head"><h2>Explore by city</h2><a href="/cities/">All cities →</a></div>
      <div class="tiles city-tiles">${LAUNCH_CITY_PAGES.map((p) => tile({ ...p, emoji: '📍' }, ctx.counts[p.key])).join('')}</div>
    </section>
    ${exploreMore('/')}`
  return layout({
    path: '/', title: page.title, description: page.description, body, preset: page.preset,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: `${siteUrl()}/` }, ...ctx.jsonld],
  })
}

// ---------- calendar ----------
export function calendarPage(page) {
  const body = `${pageHero({ eyebrow: crumbs([{ label: 'Home', href: '/' }, { label: 'Calendar' }]), h1: page.h1, description: page.description, intro: 'Pick a day to see everything happening. Dots show how many events are listed.' })}
    <section class="wrap calendar-wrap"><div id="calendar" class="calendar" aria-live="polite"></div></section>
    ${filtersHtml()}
    ${resultsHtml({ heading: 'Upcoming events', listHtml: '', count: 0, emptyHtml: '' })}
    ${exploreMore(page.path)}`
  return layout({ path: page.path, title: page.title, description: page.description, body, preset: page.preset })
}

// ---------- all cities ----------
export function citiesPage(ctx) {
  const byCounty = new Map()
  for (const c of ACTIVE_CITIES) {
    if (!byCounty.has(c.county)) byCounty.set(c.county, [])
    byCounty.get(c.county).push(c)
  }
  const groups = [...byCounty.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([county, cities]) =>
    `<div class="county"><h3>${esc(county)} County</h3><ul>${cities.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a> <span class="muted small">${ctx.counts[`city-${c.slug}`] || 0} upcoming</span></li>`).join('')}</ul></div>`).join('')
  const body = `${pageHero({ eyebrow: crumbs([{ label: 'Home', href: '/' }, { label: 'Cities' }]), h1: 'Things to do by city', description: 'Browse events in Atlanta and surrounding Metro Atlanta communities.' })}
    <section class="wrap county-grid">${groups}</section>
    <section class="wrap"><p class="muted">Coming next: Athens, Savannah, Augusta, Macon and Columbus. <a href="/submit/">Know a great local event? Tell us.</a></p></section>
    ${exploreMore('/cities/')}`
  return layout({ path: '/cities/', title: 'Things to Do by City: Metro Atlanta, Georgia', description: 'Find events in Atlanta, Decatur, Stone Mountain, Marietta, Sandy Springs, Tucker, Lithonia, Clarkston, Brookhaven, East Point, College Park and more.', body })
}

// ---------- single event ----------
export function eventPage(e, { related }) {
  const cat = categoryById(e.category)
  const catPage = categoryPageFor(e.category)
  const cityPage = CITY_PAGES.find((p) => p.city.name === e.city && !p.cityFree)
  const page = safeUrl(e.url)
  const tickets = safeUrl(e.ticketUrl)
  const img = safeUrl(e.image)
  const mapQ = encodeURIComponent([e.venue, e.address || e.city, 'GA'].filter(Boolean).join(', '))
  const src = safeUrl(e.source?.url)
  const trail = [{ label: 'Home', href: '/' }]
  if (cityPage) trail.push({ label: e.city, href: cityPage.path })
  if (catPage) trail.push({ label: catPage.nav, href: catPage.path })
  trail.push({ label: e.title })
  const cityLabel = cityPage ? `<a href="${cityPage.path}">${esc(e.city)}</a>` : esc(e.city)
  const body = `<article class="wrap event-page" style="--cat:${cat.color}">
      <p class="crumbs">${crumbs(trail)}</p>
      <div class="event-hero media">${img ? `<img src="${esc(img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span aria-hidden="true">${cat.emoji}</span></div>
      <div class="event-main">
        <div class="badges"><a class="badge" href="${catPage?.path || '/'}">${esc(cat.label)}</a>${priceBadge(e)}${e.sponsored ? '<span class="badge featured">Sponsored</span>' : e.featured ? '<span class="badge featured">Featured</span>' : ''}</div>
        <h1>${esc(e.title)}</h1>
        <dl class="facts">
          <div><dt>When</dt><dd>${esc(whenText(e, { long: true }))}</dd></div>
          <div><dt>Where</dt><dd>${esc(e.venue || '')}${e.venue && (e.address || e.city) ? '<br>' : ''}${e.address ? esc(e.address) : cityLabel}${e.address ? ` · ${cityLabel}` : ''}<br><a href="https://www.google.com/maps/search/?api=1&query=${mapQ}" target="_blank" rel="noopener">Open in Google Maps ↗</a></dd></div>
          <div><dt>Admission</dt><dd>${esc(priceLabel(e))}</dd></div>
          <div><dt>Source</dt><dd>${src ? `<a href="${esc(src)}" target="_blank" rel="noopener">${esc(e.source.name)}</a>` : esc(e.source?.name || SITE.name)}</dd></div>
        </dl>
        ${e.description ? `<h2>About this event</h2><p class="desc">${esc(e.description)}</p>` : ''}
        <div class="dialog-actions">
          ${tickets && tickets !== page ? `<a class="btn btn-primary" href="${esc(tickets)}" target="_blank" rel="noopener">Get tickets ↗</a>` : ''}
          ${page ? `<a class="btn ${tickets && tickets !== page ? 'btn-ghost' : 'btn-primary'}" href="${esc(page)}" target="_blank" rel="noopener">${e.price?.isFree === false && !tickets ? 'Tickets & details ↗' : 'Official event page ↗'}</a>` : ''}
          <button class="btn btn-ghost" type="button" data-action="ics" data-id="${esc(e.id)}">＋ Add to calendar</button>
          <button class="btn btn-ghost" type="button" data-action="share" data-id="${esc(e.id)}">↗ Share</button>
        </div>
        <p class="muted small notice">Details can change. Please confirm date, time, price and tickets on the official page before you go. See a mistake? <a href="mailto:${esc(SITE.contactEmail)}?subject=${encodeURIComponent(`Listing correction: ${e.title}`)}">Report it</a>.</p>
      </div>
    </article>
    <div class="wrap"><div class="ad-slot ad-top" data-ad="top" hidden></div></div>
    ${related.length ? `<section class="wrap related"><h2>More things to do${e.city ? ` in ${esc(e.city)}` : ''}</h2><div class="grid">${related.map(cardHtml).join('')}</div></section>` : ''}
    ${exploreMore('')}`
  return layout({
    path: eventPath(e), title: `${e.title}: ${whenText(e)} | ${e.city}, GA`,
    description: `${whenText(e, { long: true })} at ${e.venue || e.city}. ${priceLabel(e)}. ${e.description || ''}`.slice(0, 300),
    body, preset: { view: 'event', id: e.id }, jsonld: [eventJsonLd(e, siteUrl()), breadcrumbJsonLd(trail)], ogType: 'article', image: img,
  })
}

// ---------- forms ----------
const hp = '<p class="hp" aria-hidden="true"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>'

export function submitPage() {
  const cities = ACTIVE_CITIES.map((c) => `<option>${esc(c.name)}</option>`).join('')
  const cats = CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')
  const body = `${pageHero({ eyebrow: crumbs([{ label: 'Home', href: '/' }, { label: 'Submit an event' }]), h1: 'Submit your event', description: 'Hosting something in Metro Atlanta? Listing is free. A real person reviews every submission before it is published.' })}
    <section class="wrap submit-grid">
      <div class="card submit-card">
        <form data-gwf-form name="event-submission" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="event-submission">${hp}
          <div class="form-grid">
            <label class="field span-2"><span>Event name *</span><input name="title" required maxlength="140"></label>
            <label class="field"><span>Start date *</span><input name="start_date" type="date" required></label>
            <label class="field"><span>Start time</span><input name="start_time" type="time"></label>
            <label class="field"><span>End date</span><input name="end_date" type="date"></label>
            <label class="field"><span>End time</span><input name="end_time" type="time"></label>
            <label class="field span-2"><span>Venue *</span><input name="venue" required maxlength="120"></label>
            <label class="field span-2"><span>Street address *</span><input name="address" required maxlength="200"></label>
            <label class="field"><span>City *</span><select name="city" required><option value="">Choose…</option>${cities}<option value="${OTHER_CITY}">Other Georgia city (put it in the address)</option></select></label>
            <label class="field"><span>Category *</span><select name="category" required><option value="">Choose…</option>${cats}</select></label>
            <label class="field"><span>Admission *</span><select name="price_type" required><option value="">Choose…</option><option value="free">Free</option><option value="paid">Paid</option></select></label>
            <label class="field"><span>Ticket price (if paid)</span><input name="price" placeholder="$15 or $10–$25" maxlength="40"></label>
            <label class="field span-2"><span>Official event link *</span><input name="url" type="url" required placeholder="https://"></label>
            <label class="field span-2"><span>Tickets / registration link</span><input name="ticket_url" type="url" placeholder="https://"></label>
            <label class="field span-2"><span>Short description *</span><textarea name="description" rows="4" maxlength="800" required></textarea></label>
            <label class="field span-2"><span>Image link (optional, you must own the rights)</span><input name="image_url" type="url" placeholder="https://"></label>
            <label class="field"><span>Your name *</span><input name="organizer_name" required maxlength="80" autocomplete="name"></label>
            <label class="field"><span>Your email *</span><input name="organizer_email" type="email" required autocomplete="email"></label>
            <label class="check span-2"><input type="checkbox" name="permission" value="yes" required> <span>I'm the organizer or have permission to share this event and any image, and the details are accurate. I agree to the <a href="/terms/">Terms</a>. *</span></label>
          </div>
          <button class="btn btn-primary" type="submit">Send for review</button>
          <p class="form-status" role="status"></p>
        </form>
      </div>
      <aside class="submit-aside">
        <div class="card tips">
          <h2>What gets listed</h2>
          <ul>
            <li>Public events in Metro Atlanta (more Georgia cities coming)</li>
            <li>A real, official link where people can confirm details</li>
            <li>Free events, ticketed shows, festivals, markets, classes and more</li>
          </ul>
          <p class="muted small">We may edit for length and clarity. Your email is only used to follow up about your listing. Want extra visibility? See <a href="/advertise/">sponsored listings</a>.</p>
        </div>
      </aside>
    </section>`
  return layout({ path: '/submit/', title: 'Submit Your Event: Free Listing | Georgia Weekend Finder', description: 'Add your Atlanta or Georgia event to Georgia Weekend Finder for free. Every submission is reviewed before publishing.', body })
}

export function advertisePage() {
  const body = `${pageHero({ eyebrow: crumbs([{ label: 'Home', href: '/' }, { label: 'Advertise' }]), h1: 'Advertise with us', description: 'Reach people actively looking for things to do around Atlanta this weekend.' })}
    <section class="wrap ad-options">
      <div class="card"><h2>⭐ Sponsored event listing</h2><p>Your event is highlighted at the top of its day and on relevant category and city pages. It is always labeled <strong>Sponsored</strong>.</p></div>
      <div class="card"><h2>🏪 Featured local business</h2><p>A clearly labeled ad spot for restaurants, venues, attractions and local services, shown beside event listings in your area.</p></div>
      <div class="card"><h2>📣 Organizer promotion package</h2><p>For festivals and recurring events: sponsored placement across your event dates plus a featured spot on the home page.</p></div>
    </section>
    <section class="wrap prose">
      <h2>Our standards</h2>
      <ul>
        <li>Every paid placement is labeled "Sponsored" or "Advertisement" and kept visually separate from regular listings.</li>
        <li>Payment never changes whether a free event is listed or how it is described.</li>
        <li>Sponsored events must be real, public, and link to an official page. We review them like every other listing.</li>
        <li>We can't guarantee clicks, ticket sales or attendance, and we don't promise any particular result.</li>
      </ul>
    </section>
    <section class="wrap submit-grid">
      <div class="card submit-card">
        <h2>Ask about rates</h2>
        <form data-gwf-form name="advertise-inquiry" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="bot-field">
          <input type="hidden" name="form-name" value="advertise-inquiry">${hp}
          <div class="form-grid">
            <label class="field"><span>Your name *</span><input name="name" required maxlength="80" autocomplete="name"></label>
            <label class="field"><span>Business / organization *</span><input name="business" required maxlength="120" autocomplete="organization"></label>
            <label class="field"><span>Email *</span><input name="email" type="email" required autocomplete="email"></label>
            <label class="field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel"></label>
            <label class="field span-2"><span>I'm interested in *</span><select name="interest" required><option value="">Choose…</option><option>Sponsored event listing</option><option>Featured local business</option><option>Organizer promotion package</option><option>Something else</option></select></label>
            <label class="field span-2"><span>Tell us about it</span><textarea name="message" rows="4" maxlength="1500"></textarea></label>
          </div>
          <button class="btn btn-primary" type="submit">Send inquiry</button>
          <p class="form-status" role="status"></p>
        </form>
      </div>
    </section>`
  return layout({ path: '/advertise/', title: 'Advertise With Us | Georgia Weekend Finder', description: 'Sponsored event listings and local business advertising on Georgia Weekend Finder, an Atlanta events guide.', body })
}

// ---------- simple pages ----------
function prosePage(path, title, description, h1, html, extra = {}) {
  const body = `${pageHero({ eyebrow: crumbs([{ label: 'Home', href: '/' }, { label: h1 }]), h1, description })}
    <section class="wrap prose">${html}</section>`
  return layout({ path, title, description, body, ...extra })
}

export function privacyPage() {
  return prosePage('/privacy/', 'Privacy Policy | Georgia Weekend Finder', 'How Georgia Weekend Finder handles information, cookies, analytics and advertising.', 'Privacy Policy', `
    <p class="muted">Last updated: October 2026. <!-- Have this reviewed before launch; update the date whenever it changes. --></p>
    <h2>What we collect</h2>
    <p><strong>Event submissions and advertising inquiries.</strong> We receive the details you enter, including your name and email, so we can follow up. We don't sell this information. Published listings show event details only, never your email.</p>
    <p><strong>Analytics.</strong> We may use privacy-friendly analytics (such as Cloudflare Web Analytics) or Google Analytics to understand which pages are popular. These tools may collect your IP address, browser type and pages visited.</p>
    <p><strong>Server logs.</strong> Our hosting provider keeps standard logs for security and reliability.</p>
    <h2>Cookies and advertising</h2>
    <p>We may show ads served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this site and/or other sites on the Internet.</p>
    <p>You can opt out of personalized advertising at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a> or at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a>. Learn more about <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses data from partner sites</a>.</p>
    <p>We store your light/dark display preference in your browser.</p>
    <h2>Event information</h2>
    <p>Listings come from public sources that permit reuse and from reviewed submissions. Organizers can ask us to correct or remove a listing at any time.</p>
    <h2>Contact</h2>
    <p>Questions or removal requests: <a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a></p>`)
}

export function termsPage() {
  return prosePage('/terms/', 'Terms of Use | Georgia Weekend Finder', 'Terms for using Georgia Weekend Finder, submitting events and advertising.', 'Terms of Use', `
    <p class="muted">Last updated: October 2026. <!-- Have an attorney review before launch. --></p>
    <h2>Event information</h2>
    <p>We list events from approved public sources and reviewed submissions, and we work to keep them accurate. Events can change or be cancelled without notice, so we can't guarantee that any listing is complete or current. Always confirm dates, times, prices, tickets and accessibility with the organizer before you go. We are not the organizer of listed events unless we say so.</p>
    <h2>Submitting events</h2>
    <p>When you submit an event, you confirm that you are the organizer or have permission to share it, that the information is accurate, and that you own or have permission to use any image you provide. You give us permission to publish, edit for length and clarity, and promote the listing. We may decline or remove any listing at our discretion.</p>
    <h2>Sponsored content and advertising</h2>
    <p>Paid placements are labeled "Sponsored" or "Advertisement." Advertising does not guarantee any number of views, clicks, sales or attendees. Advertisers are responsible for their own claims and offers.</p>
    <h2>Images and content</h2>
    <p>Event images are provided by organizers or by the source that published the event. If you believe content on this site uses your work without permission, email us and we will review and remove it promptly.</p>
    <h2>Links to other sites</h2>
    <p>We link to official event pages and ticket sellers. We are not responsible for their content, policies or transactions.</p>
    <h2>Limitation of liability</h2>
    <p>This site is provided "as is." To the fullest extent allowed by law, Georgia Weekend Finder is not liable for losses arising from your use of the site or attendance at any event.</p>
    <h2>Changes and contact</h2>
    <p>We may update these terms; the date above shows the latest version. These terms are governed by the laws of the State of Georgia. Contact: <a href="mailto:${esc(SITE.contactEmail)}">${esc(SITE.contactEmail)}</a></p>`)
}

export function thanksPage() {
  return prosePage('/thanks/', 'Thanks! | Georgia Weekend Finder', 'Submission received.', 'Thanks, we got it!', `
    <p>Your submission is in our review queue. We'll email you if we have questions.</p>
    <p><a class="btn btn-primary" href="/">Back to events</a></p>`, { noindex: true })
}

export function notFoundPage() {
  return prosePage('/404.html', 'Page not found | Georgia Weekend Finder', 'This page does not exist or the event has ended.', 'Page not found', `
    <p>This page doesn't exist, or the event has already ended and was removed.</p>
    <p><a class="btn btn-primary" href="/this-weekend/">See this weekend's events</a> <a class="btn btn-ghost" href="/">Home</a></p>`, { noindex: true })
}
