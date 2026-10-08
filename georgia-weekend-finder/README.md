# Georgia Weekend Finder

A fast, mobile-friendly guide to **free and paid things to do around Atlanta and
Georgia**. Every section, category, city and event has its own page, events update
automatically every morning, and nothing is ever made up.

> **Start here:** [`PROJECT_STATUS.md`](PROJECT_STATUS.md) covers what's done, what's next,
> costs, and your to-do list.

Events come only from:

1. **Approved automated sources**: official calendar feeds and APIs you have
   permission to republish (`data/sources.json`)
2. **Manual curation**: events you add by hand, including approved submissions
   (`data/manual-events.json`)

Until one of those has events, the site shows a friendly "Fresh listings are on the way" message.

---

## How it fits together

```
 every morning (GitHub Actions, free)                 on every change (Netlify, free)
┌───────────────────────────────────────┐            ┌──────────────────────────────────┐
│ scripts/update-events.mjs             │  commits   │ scripts/build-site.mjs           │
│  • fetch APPROVED sources only        │ ─────────▶ │  • one HTML page per section,    │
│  • merge manual-events.json           │ events.json│    category, city and event      │
│  • hold questionable events           │            │  • sitemap.xml, robots.txt       │
│  • flag things to double-check        │            │  → publishes dist/               │
│  • refuse to publish a broken run     │            └──────────────────────────────────┘
└───────────────────────────────────────┘
```

```
georgia-weekend-finder/
├── PROJECT_STATUS.md       Status, decisions, costs, next steps
├── assets/
│   ├── config.js           ← YOUR SETTINGS: domain, email, AdSense, analytics, forms
│   ├── taxonomy.js         ← Categories and cities (turn expansion cities on here)
│   ├── sections.js         Every listing page: title, description, filters
│   ├── render.js           Event cards/lists (shared by builder and browser)
│   ├── app.js              Filters, calendar, quick view, forms, ads, analytics
│   ├── time.js             Eastern-time date helpers
│   └── styles.css          Design (light + dark)
├── data/
│   ├── sources.json        ← Approved automated sources
│   ├── manual-events.json  ← Hand-added events + "approve" and "suppress" lists
│   ├── local-ads.json      ← Directly sold local business ads
│   ├── events.json         GENERATED: what the site shows
│   └── review-queue.json   GENERATED: held + flagged events for you to check
├── scripts/
│   ├── update-events.mjs   Daily updater
│   ├── build-site.mjs      Page builder → dist/
│   ├── serve.mjs           Local preview server
│   └── lib/                Feed adapters, normalizing, quality review, page templates
└── tests/                  Automated tests (npm test)
```

---

## 1. Preview on your computer

You need [Node.js 20+](https://nodejs.org). There's nothing else to install.

```bash
cd georgia-weekend-finder
npm test        # runs the tests
npm start       # builds the site and opens it at http://localhost:8080
```

---

## 2. Launch it (about 20 minutes)

### Netlify (recommended: free, and the forms work with no extra setup)

1. Buy a domain (e.g. from Cloudflare, Namecheap or Porkbun; about $10–20/year).
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing
   project** → connect GitHub → pick this repository.
3. Build settings (`netlify.toml` fills most of these in):
   - **Base directory:** `georgia-weekend-finder`
   - **Build command:** `npm test && npm run build`
   - **Publish directory:** `dist`
4. Deploy. Then go to **Forms → Enable form detection** and redeploy once.
   You'll receive both the **event-submission** and **advertise-inquiry** forms. Turn on email
   notifications for each.
5. **Domain management → Add your domain.** HTTPS is automatic.
6. In `assets/config.js`, set `url` to your domain and `contactEmail` to your address. Commit.

**Cloudflare Pages** works the same way (root directory `georgia-weekend-finder`, build
command `npm run build`, output `dist`). Use Formspree for forms there: set
`submissions.provider: 'formspree'` in `config.js`.

### One-time GitHub setup

- Merge the pull request into `main` (scheduled jobs only run from `main`).
- **Settings → Actions → General → Workflow permissions → Read and write.**
- (When you enable Ticketmaster) **Settings → Secrets and variables → Actions →
  New repository secret** → `TICKETMASTER_API_KEY`.

### After launch

- **Google Search Console:** add your domain and submit `https://YOURDOMAIN/sitemap.xml`.
- **Analytics (free):** in `config.js` set `analytics: { provider: 'cloudflare', id: 'TOKEN' }`
  (from Cloudflare → Web Analytics) or `{ provider: 'ga4', id: 'G-XXXXXXX' }`.

---

## 3. Daily automatic updates

`.github/workflows/georgia-weekend-finder-update.yml` runs **every morning around 6 AM ET**,
whenever you edit `manual-events.json` / `sources.json`, or on demand (**Actions → Run workflow**).

Each run:

1. Runs the tests
2. Validates `manual-events.json`. A typo fails the run instead of publishing bad data
3. Fetches every **enabled + approved** source
4. Cleans up events: Eastern time, city, category, free/paid. It removes past events,
   events outside current coverage, and duplicates
5. **Reviews quality.** Questionable events are held back, and minor issues are flagged
6. Refuses to publish if the event count suddenly collapses (usually a broken feed)
7. Builds the site to make sure nothing is broken, then commits the data. Netlify redeploys

If a source is temporarily down, its events from the last good run are kept for up to 3 days.
**If a run fails, GitHub emails you.** The previous good data stays live.

### Your weekly check (10–15 minutes)

1. Open **GitHub → Actions → latest "daily event update" run**. The summary shows sources,
   **held** events (not published) and **flagged** events (published, worth a glance).
2. Held event that's actually fine? Add its `id` to `"approve"` in `data/manual-events.json`.
3. Flagged event that's wrong or a duplicate? Add its `id` to `"suppress"`.
4. Review new **form submissions** in Netlify. Verify the official link, then add approved
   ones to `manual-events.json`.

The same information is saved in `data/review-queue.json`.

---

## 4. Adding sources

A source in `data/sources.json` is used **only** when both are true:

```json
"enabled": true,
"permission": {
  "status": "approved",
  "basis": "Why you're allowed to republish (terms link, email from the organizer, etc.)",
  "verifiedOn": "2026-10-08"
}
```

| type | Use for | Notes |
|---|---|---|
| `ics` | iCal "subscribe" links from city, county, library, parks, venue and organizer calendars | Handles time zones, all-day and repeating events |
| `jsonld` | Event pages that publish schema.org `Event` data | Only with the owner's OK. Obeys `robots.txt` |
| `json` | Official open-data / partner JSON APIs | Map fields with `itemsPath` + `fields`. Keys go in GitHub secrets via `{env.NAME}` |
| `ticketmaster` | Ticketmaster Discovery API (concerts, sports, theater) | Free key. Their terms require attribution and links back, which the site already provides |

Optional `defaults` fill gaps (`{"city": "Decatur", "category": "family", "price": "free"}`), and
`categoryMap` maps a feed's own category names to ours. Test without publishing:
`npm run update:dry`.

**Don't** scrape sites whose terms forbid it, anything behind a login, or Facebook, Instagram or
Eventbrite pages.

## 5. Adding events by hand

```json
{
  "events": [
    {
      "title": "Event name exactly as the organizer lists it",
      "start": "2026-10-17T10:00",
      "end": "2026-10-17T14:00",
      "venue": "Venue name",
      "address": "Street, City, GA",
      "city": "Decatur",
      "category": "festivals-markets",
      "price": "free",
      "url": "https://official-event-page",
      "ticketUrl": "https://tickets-or-registration (optional)",
      "description": "One or two sentences.",
      "featured": false,
      "sponsored": false
    }
  ],
  "suppress": [],
  "approve": []
}
```

- `start` / `end`: `2026-10-17` (all day), `2026-10-17T10:00` (Eastern), or a full ISO time
- `category`: `live-music`, `family`, `food-drink`, `outdoor`, `arts-theater`, `festivals-markets`,
  `sports`, `comedy-nightlife`, `community`
- `price`: `"free"`, `"$15"`, `"$10-$25"`, or `"paid"`
- `featured: true` highlights an editor's pick. **`sponsored: true` is for paid placements** and
  shows a "Sponsored" label (FTC disclosure)
- `"hidden": true` keeps an entry without publishing it

## 6. Coverage: cities and expansion

Cities live in `assets/taxonomy.js`. Launch cities: Atlanta, Decatur, Stone Mountain, Marietta,
Sandy Springs, Tucker, Lithonia, Clarkston, Brookhaven, East Point, College Park, plus 24 more
metro cities. Neighborhoods and landmarks (Buckhead, Little Five Points, Arabia Mountain, Stone
Mountain Park, The Battery…) map to their city.

**To expand** (Savannah, Augusta, Macon, Columbus, Athens, Gainesville): change `active: false` to
`true` for the city, then add sources that cover it. The Ticketmaster source searches 50 miles
around Atlanta, so for Savannah add a second Ticketmaster source with Savannah's
`latlong` (`32.0809,-81.0912`). City pages, filters and the sitemap update automatically.

## 7. Making money (all optional, all labeled)

| Option | How |
|---|---|
| **Google AdSense** | After a few weeks of steady real listings, apply at adsense.google.com. Then in `config.js` set `adsense.enabled: true`, your `client` ID, and ad unit IDs for `top`, `inFeed` and `local`. Rename `ads.txt.example` → `ads.txt` with your publisher ID |
| **Sponsored event listings** | Organizer pays → add/mark the event with `"sponsored": true`. Shown first within its day with a "Sponsored" label |
| **Featured local business ads** | Add to `data/local-ads.json` (shown in a "Sponsored · Local business" box; the AdSense `local` unit fills the spot when none is active) |
| **Organizer packages** | Sponsored listing + home page "Featured" spot for festivals or recurring events |
| **Affiliate ticket links** | Possible later (e.g. ticketing affiliate programs). Must be disclosed |

```json
{ "ads": [
  { "business": "Example Café", "text": "Brunch on the square, 10% off with this ad",
    "url": "https://example.com", "image": "https://example.com/logo.png",
    "start": "2026-11-01", "end": "2026-11-30", "cities": ["Decatur"] }
] }
```

Inquiries arrive through the **Advertise** page form. Never promise results. The page already says so.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Fresh listings are on the way" | No approved sources or manual events yet, or all are in the past |
| Daily run failed on `manual-events.json` | The log names the entry and the missing field |
| Daily run failed with "Event count dropped" | A source broke. Check the source errors. If it's expected, rerun with **force** checked |
| An event you expected is missing | Check the run summary's **Held** list and approve it |
| Wrong category | Add `categoryMap` / `defaults.category` to the source, or keywords in `taxonomy.js` |
| Forms say it didn't go through | On Netlify, enable form detection and redeploy. Elsewhere, use Formspree |
