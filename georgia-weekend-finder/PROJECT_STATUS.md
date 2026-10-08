# Georgia Weekend Finder: Project Status

_Last updated: October 8, 2026. Update this file at the end of every work session._

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 1. Design, navigation, listings, filters | ✅ **Done** | All requested sections built as real pages (see below) |
| 2. Real data sources + database | 🟡 **Engine ready, no sources approved yet** | Needs you: permission or API keys (see "Your to-do list") |
| 3. Automated daily updates | ✅ **Done, runs after merge** | Daily GitHub Action with review queue and safety checks |
| 4. Public launch, SEO, analytics, monitoring | 🟡 **SEO built in; not deployed** | Needs a domain + Netlify account (about 20 minutes) |
| 5. Repeat traffic + ad monetization | 🟡 **Ad spots built, switched off** | AdSense waits until the site has steady real content |
| 6. Statewide expansion | ⚪ **Prepared** | Savannah, Augusta, Macon, Columbus, Athens, Gainesville listed but switched off |

## What's built

**Pages** (each one is a real page with its own web address, title and description for Google):

- Home: featured events, quick links, popular activities, this weekend, cities
- `/today/`, `/tomorrow/`, `/this-weekend/`, `/free/`, `/date-night/`, `/calendar/`
- Categories: `/concerts-live-music/`, `/festivals-community-events/`, `/food-dining/`,
  `/nightlife-entertainment/`, `/family-kids/`, `/outdoor-adventures/`, `/arts-theater/`, `/sports/`
- Cities: `/atlanta/`, `/decatur/`, `/stone-mountain/`, `/marietta/`, `/sandy-springs/`, `/tucker/`,
  `/lithonia/`, `/clarkston/`, `/brookhaven/`, `/east-point/`, `/college-park/` + 24 more metro cities,
  each with a "free things to do" page (e.g. `/decatur/free/`), and `/cities/` grouped by county
- One page per event with a descriptive address, e.g. `/event/2026-10-10-jazz-on-the-square-decatur-a1b2c3/`
- `/submit/` (event submission), `/advertise/` (advertising inquiry), `/privacy/`, `/terms/`, 404 page

**Every event shows** name, date, time, location (with map link), description, admission price,
official source, and ticket/registration link when available.

**Filters:** date, city, category, price, Date Night, and keyword search on every listing page.

**SEO:** pages are pre-built with the event listings already in the HTML. Also included: event
structured data (for Google's event results), breadcrumbs, sitemap.xml, canonical links, and lots of
internal links. City and category pages with fewer than 3 events are hidden from Google until
they fill up, so thin pages don't hurt the site.

**Accuracy rules (built into the code):**
- Only sources marked `enabled` + `approved` (with a written reason and date) are ever fetched
- Questionable events (cancelled/postponed wording, no location, placeholder titles) are **held**
  and never published until you approve them
- Unknown prices show "See official site". Nothing is guessed
- Possible duplicates across sources, unrecognized cities and missing event links are **flagged**
  for a quick look
- If a run suddenly loses 70%+ of events, it refuses to publish and the failed run emails you
- Expired events disappear automatically

**Money-making groundwork (all clearly labeled):** Google AdSense spots (off until approved), sponsored
event listings (`"sponsored": true`), featured local business ads (`data/local-ads.json`), and an
Advertise page with an inquiry form. No earnings promises anywhere.

## What "automatic" means here

Claude doesn't run in the background. Three free services do the work:

1. **GitHub Actions** runs `update-events` every morning (~6 AM ET): it fetches approved
   sources, checks quality, and saves `data/events.json` and `data/review-queue.json`.
2. **Netlify** (or Cloudflare Pages) sees that change and rebuilds every page in seconds.
3. **You** glance at the run summary on GitHub (Actions tab) once or twice a week to approve
   held events and review new submissions. That's about 10–15 minutes a week.

The "database" is the `data/` folder in GitHub. It's free, every change is backed up in history,
and it's easy to edit in the browser. That's the right choice until you need several people
editing at once (see "Later" below).

## Your to-do list (things only you can do)

1. **Merge PR #3** on GitHub.
2. **GitHub setting:** Settings → Actions → General → Workflow permissions → **Read and write**.
3. **Buy a domain** (about $10–20/year), then **create a free Netlify site** (README section 2).
4. **Replace placeholders** in `assets/config.js`: `url` and `contactEmail`.
5. **Line up the first data sources.** Best first picks:
   - **Ticketmaster Discovery API** (free key at developer.ticketmaster.com) covers concerts,
     sports and theater right away
   - City / county parks & recreation and library calendars (Decatur, DeKalb, Sandy Springs,
     Marietta, Tucker, Brookhaven, etc.). Look for "Subscribe" / iCal links and check their terms,
     or email them asking permission
   - Local venues and festivals: a short permission email is usually enough
6. **Add analytics:** a free Cloudflare Web Analytics token in `config.js`.
7. After a few weeks of steady real listings: **apply for AdSense**.

## Costs

| Item | Cost | Free alternative / notes |
|---|---|---|
| Domain name | ~$10–20/year | Required for AdSense and a professional look |
| Hosting (Netlify or Cloudflare Pages) | $0 on free plans | Free plans cover a site this size. Check current limits when signing up |
| Daily automation (GitHub Actions) | $0 | About 1–2 minutes per day, well within the free allowance |
| Submission forms (Netlify Forms) | $0 at low volume | Formspree free plan as backup |
| Ticketmaster API | $0 | Free key with daily limits far above our use |
| Analytics | $0 | Cloudflare Web Analytics or Google Analytics 4 |
| AI summaries (optional, not built) | Pay-per-use API | Skipped on purpose: see below |

**Expected total to launch: about $10–20/year (the domain).**

## Decisions made (and why)

- **No AI-written event descriptions yet.** We publish the organizer's own description (trimmed).
  AI rewriting would add cost, could introduce mistakes, and Google discourages mass
  auto-generated text. Categorization, duplicate detection and quality checks use free rules
  instead. Revisit once we have traffic, possibly using AI only to *suggest* fixes for held events.
- **Static pages instead of a server.** Faster, free to host, nothing to hack or keep patched.
- **Expansion cities switched off** until Metro Atlanta has steady coverage.
- **Research note:** the reference site metroatlhousing.org didn't load from my environment (its
  address didn't resolve). The coverage list uses your starting cities plus standard Metro Atlanta
  geography. Housing data is never used as event data.

## Known issues / open items

- No real events yet. The site shows a friendly "Fresh listings are on the way" message until
  sources are approved or events are added by hand.
- `privacy` and `terms` pages are solid templates but should get a quick legal review.
- Placeholder domain `georgiaweekendfinder.com` and email need replacing.
- Event images come from sources and are linked, not copied. If a source objects, suppress the
  event or remove the image.

## Recommended next steps

1. **Next session (Phase 2):** connect Ticketmaster plus 2–3 city calendars once you have the key or
   permission. I'll test each source, tune categories, and check the review queue output.
2. **Then (Phase 4):** deploy to Netlify with your domain, submit the sitemap to Google Search
   Console, and turn on analytics.
3. **Then (Phase 5):** weekly "This weekend in Atlanta" email newsletter (free tiers exist) for repeat
   visitors, social sharing images, and a sponsor rate card.
4. **Later (Phase 6):** switch on Athens and Savannah first (`active: true` in `assets/taxonomy.js`)
   and add sources for them.
5. **Later, if needed:** a simple admin screen and hosted database (Supabase or Cloudflare D1,
   both with free tiers) if more than one person curates events.
