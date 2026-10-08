# Georgia Weekend Finder

A fast, mobile-friendly site listing **free and paid events around Atlanta and
nearby Georgia cities**. Visitors filter by date, city, category and price,
open event details, add to calendar, share, and submit their own events.

**No events are made up.** Listings come only from:

1. **Approved automated sources**: official calendar feeds and APIs you have
   permission to republish (`data/sources.json`)
2. **Manual curation**: events you add by hand, including approved
   submissions (`data/manual-events.json`)

The site starts empty and shows a "Fresh listings are on the way" message until
you approve your first source or add your first event.

---

## What's inside

```
georgia-weekend-finder/
├── index.html              Main page: hero, filters, results, submission form, sources
├── privacy.html            Privacy policy (needed for AdSense)
├── thanks.html             Fallback page after a form submission
├── assets/
│   ├── config.js           ← YOUR SETTINGS: domain, email, AdSense, form provider
│   ├── app.js              Filtering, rendering, event dialog, calendar export, ads
│   ├── taxonomy.js         Categories + cities (shared by site and updater)
│   ├── time.js             Eastern-time date helpers
│   └── styles.css          Design (light + dark mode)
├── data/
│   ├── events.json         GENERATED: what the site displays (don't hand-edit)
│   ├── sources.json        ← Approved automated sources
│   └── manual-events.json  ← Hand-curated events + suppress list
├── scripts/
│   ├── update-events.mjs   Daily updater (no dependencies)
│   ├── serve.mjs           Local preview server
│   └── lib/                ICS / JSON-LD / JSON / Ticketmaster adapters
├── tests/updater.mjs       Tests (dates, DST, recurring events, parsing, permission guard)
├── netlify.toml            Hosting config
├── robots.txt, sitemap.xml, ads.txt.example
```

The daily automation lives at the repo root:
`.github/workflows/georgia-weekend-finder-update.yml`.

**Categories:** Live Music · Family & Kids · Food & Drink · Outdoor & Nature ·
Arts & Theater · Festivals & Markets · Sports · Comedy & Nightlife · Community & Classes.
Edit them in `assets/taxonomy.js`.

**Cities:** Atlanta (including neighborhoods like Buckhead, Old Fourth Ward,
Little Five Points), Decatur, Marietta, Alpharetta, Roswell, Sandy Springs,
Smyrna, Kennesaw, Duluth, Lawrenceville, Peachtree City, Athens and about 20
more. Anything else in Georgia shows as "Other Georgia."

---

## 1. Preview it on your computer

You need [Node.js 20+](https://nodejs.org). There's nothing to install.

```bash
cd georgia-weekend-finder
npm test           # runs the test suite
npm start          # open http://localhost:8080
```

---

## 2. Launch it (about 20 minutes)

### Option A: Netlify (recommended, since the submission form works with no setup)

1. **Recommended:** put this folder in its own GitHub repo, e.g.
   `georgia-weekend-finder`. (It can stay in this repo too. See the note below.)
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → pick the repo.
3. Build settings:
   - **Base directory:** `georgia-weekend-finder` (or blank if it's its own repo)
   - **Build command:** `npm test`
   - **Publish directory:** `.` (Netlify shows this as `georgia-weekend-finder` when you set a base directory)
4. Deploy. You'll get a `something.netlify.app` URL.
5. **Forms:** In Netlify → *Forms*, turn on form detection, then redeploy. Submissions
   show up under **Forms → event-submission**. Turn on email notifications
   so you hear about each one.
6. **Custom domain:** buy a domain (e.g. `georgiaweekendfinder.com`) and add it under
   *Domain management*. HTTPS is automatic.
7. Update your domain and email in `assets/config.js`, `index.html`
   (canonical/og tags), `robots.txt`, `sitemap.xml`, and `privacy.html`.

### Option B: Cloudflare Pages

Same steps: connect the repo, set the root directory to
`georgia-weekend-finder`, leave the build command empty (or `npm test`), and set
the output directory to `.`. Netlify Forms won't work there, so in
`assets/config.js` set `submissions.provider` to `'formspree'` and add a free
[Formspree](https://formspree.io) form ID.

> **Keeping it inside this repo?** That works. The Coverage Compass deploy
> workflow ignores this folder, and the daily updater workflow is already set
> up for the `georgia-weekend-finder/` path.

---

## 3. Keep events updating automatically

The GitHub Action `georgia-weekend-finder-update.yml` runs **every morning
around 6 AM Eastern**. It also runs when you edit `manual-events.json` or
`sources.json` on `main`, and you can start it from **Actions → Run workflow**.

Each run:

1. Runs the tests
2. Validates `manual-events.json` and **fails loudly** on a typo instead of
   publishing bad data
3. Fetches every source that is **enabled AND approved**
4. Normalizes events (Eastern time, city, category, free/paid), drops past
   events and anything outside Georgia, removes duplicates, and keeps 90 days ahead
5. Commits `data/events.json` → your host redeploys automatically

**Resilience:** if a source is down, the updater keeps that source's events from
the last good run (up to 3 days) so the site doesn't suddenly empty out.

**One-time GitHub setup:**

- Scheduled workflows run only on the **default branch** (`main`), so merge
  this work into `main`.
- **Settings → Actions → General → Workflow permissions** → choose
  *Read and write permissions* so the bot can commit.
- If you enable Ticketmaster: **Settings → Secrets and variables → Actions →
  New repository secret** → `TICKETMASTER_API_KEY`.
- GitHub pauses scheduled workflows after 60 days with no repo activity. The
  daily commits count as activity, but check the Actions tab now and then.

### Adding an approved source

Open `data/sources.json`. A source is used **only** when both of these are true:

```json
"enabled": true,
"permission": {
  "status": "approved",
  "basis": "Why you're allowed to republish (terms link, partner email, etc.)",
  "verifiedOn": "2026-10-08"
}
```

Supported source types:

| type | Use it for | Notes |
|---|---|---|
| `ics` | iCal "subscribe" links from city, county, library, parks, venue and organizer calendars | Handles time zones, all-day events and recurring events (weekly markets, "first Friday" art walks) |
| `jsonld` | An events page that publishes schema.org `Event` data | Only with the owner's permission. The updater also obeys `robots.txt` |
| `json` | Official open-data or partner JSON APIs | Map fields with `itemsPath` + `fields`. API keys go in `{env.NAME}` placeholders and GitHub secrets |
| `ticketmaster` | Ticketmaster Discovery API (concerts, sports, theater) | Free key at developer.ticketmaster.com. Read their terms: attribution and links back are required, and the site already shows "via Ticketmaster" and links to the official page |

Optional per-source `defaults` fill gaps: `{"city": "Decatur", "category":
"family", "price": "free"}`. For example, use `"price": "free"` for a library
calendar where every event is free. `categoryMap` maps a feed's own category
names to ours.

**Good sources to ask about (verify each one's terms first):** city and county
parks & rec calendars (Decatur, Marietta, Roswell, Alpharetta, Sandy Springs,
DeKalb, Cobb, Gwinnett), county library systems, Atlanta BeltLine, farmers
markets, museums, theaters, breweries and music venues that offer iCal feeds.
Many venues will happily say yes to free promotion; save their reply as your
`basis`.

**Don't** scrape sites whose terms prohibit it, sites behind logins, or
Facebook/Instagram/Eventbrite pages. Use their official APIs only where the terms
allow it.

Test a new source without publishing:

```bash
npm run update:dry
```

### Adding events by hand

Add entries to `data/manual-events.json`:

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
      "description": "One or two sentences.",
      "featured": false,
      "sponsored": false
    }
  ],
  "suppress": []
}
```

- `start` / `end`: `2026-10-17` (all day), `2026-10-17T10:00` (Eastern time), or a full ISO time
- `category`: `live-music`, `family`, `food-drink`, `outdoor`, `arts-theater`,
  `festivals-markets`, `sports`, `comedy-nightlife`, `community`
- `price`: `"free"`, `"$15"`, `"$10-$25"`, or `"paid"`
- `url` is required so visitors can verify details
- `featured: true` highlights a listing. Use `sponsored: true` for **paid**
  placements so they're labeled "Sponsored" (FTC disclosure)
- `"hidden": true` keeps an entry in the file without publishing it
- `suppress`: list event `id`s or URLs from automated feeds to hide

Past events drop off automatically. You don't need to delete them.

### Handling submissions (weekly routine, about 10 minutes)

1. Open Netlify → Forms (or Formspree) and review new submissions.
2. Check the official link. Make sure it's real, public, in Georgia, and the details match.
3. Copy approved ones into `manual-events.json` (GitHub's web editor works fine).
4. Commit. The workflow validates the file and publishes within a couple of minutes.

---

## 4. Turn on Google AdSense later

Ad placements are already built in and switched off:

- a banner under the filters
- in-feed ads between event cards (at most 3 per page, every N cards)
- a sidebar ad next to the submission form

When you're ready:

1. Launch with real content first. AdSense rejects empty or thin sites, so wait
   until you have a steady flow of events.
2. Apply at [adsense.google.com](https://adsense.google.com) with your custom domain.
3. In `assets/config.js`:
   ```js
   adsense: {
     enabled: true,
     client: 'ca-pub-1234567890123456',
     slots: { top: '1111111111', inFeed: '2222222222', sidebar: '3333333333' },
     inFeedEvery: 8,
   }
   ```
   (Create the units in AdSense → Ads → By ad unit. Use "In-feed" for `inFeed`.
   You can also leave the slots empty and just turn on **Auto ads**.)
4. Rename `ads.txt.example` → `ads.txt` and put in your publisher ID.
5. The privacy policy already includes Google's required cookie disclosure.
   Have it reviewed, and for visitors from the EEA/UK enable a certified consent
   message (AdSense → Privacy & messaging).

Ads are clearly labeled "Advertisement", and nothing loads while `enabled` is `false`.

---

## 5. Grow it

- **SEO:** every page view includes schema.org `Event` data so events can show
  up in Google's event results. Submit `sitemap.xml` in Google Search Console.
- **Shareable filters:** filters live in the URL (e.g. `/?when=weekend&cat=family&price=free`),
  so you can link "Free family events this weekend" from social posts and newsletters.
- **Event deep links:** `/#event-<id>` opens a specific event.
- **Revenue beyond ads:** "Featured" placements for venues (labeled Sponsored),
  a weekly email digest, or local business partnerships.

## Troubleshooting

| Problem | Fix |
|---|---|
| Site says "Fresh listings are on the way" | No approved sources or manual events yet, or they're all in the past |
| Workflow failed on `manual-events.json` | The log names the entry and the missing field |
| A source shows `error` in the run log | Feed URL changed or is down. Last-good events are kept for 3 days |
| Wrong category on a feed event | Add a `categoryMap` or `defaults.category` to the source, or add keywords in `taxonomy.js` |
| Form says it didn't go through | On Netlify, enable form detection and redeploy. Elsewhere, switch to Formspree |
