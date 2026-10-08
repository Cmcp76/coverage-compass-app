// Shared by the browser (assets/app.js) and the daily updater
// (scripts/update-events.mjs), so categories and cities stay in sync.

export const TIMEZONE = 'America/New_York'

// `keywords` drive automatic categorization of feed events. Manual events
// always set their category explicitly.
export const CATEGORIES = [
  {
    id: 'live-music', label: 'Concerts & Live Music', slug: 'concerts-live-music', emoji: '🎸', color: '#ff4d6d',
    keywords: ['concert', 'live music', 'band', 'jazz', 'blues', 'symphony', 'orchestra', 'acoustic', 'singer', 'songwriter', 'hip hop', 'rap', 'bluegrass', 'choir', 'r&b', 'tour', 'dj', 'gospel', 'country music', 'open mic'],
  },
  {
    id: 'family', label: 'Family & Kids', slug: 'family-kids', emoji: '🧸', color: '#4cc9f0',
    keywords: ['kids', 'kid', 'family', 'families', 'children', 'storytime', 'story time', 'toddler', 'toddlers', 'all ages', 'puppet', 'teens', 'homeschool', 'trick-or-treat', 'santa', 'egg hunt'],
  },
  {
    id: 'food-drink', label: 'Food & Dining', slug: 'food-dining', emoji: '🍑', color: '#ff9e00',
    keywords: ['food', 'wine', 'beer', 'brewery', 'tasting', 'chef', 'cooking', 'brunch', 'bbq', 'barbecue', 'food truck', 'food trucks', 'cocktail', 'cocktails', 'distillery', 'dinner', 'restaurant week'],
  },
  {
    id: 'outdoor', label: 'Outdoor Adventures', slug: 'outdoor-adventures', emoji: '🌲', color: '#2ec4b6',
    keywords: ['hike', 'hiking', 'trail', 'trails', 'park', 'garden', 'gardens', 'nature', 'bike', 'cycling', '5k', '10k', 'run', 'kayak', 'paddle', 'outdoor', 'outdoors', 'birding', 'beltline', 'lake', 'camping', 'yoga in the park'],
  },
  {
    id: 'arts-theater', label: 'Arts & Theater', slug: 'arts-theater', emoji: '🎭', color: '#9d4edd',
    keywords: ['art', 'arts', 'gallery', 'exhibit', 'exhibition', 'museum', 'theater', 'theatre', 'ballet', 'dance', 'film', 'movie', 'screening', 'opera', 'poetry', 'musical', 'play', 'art walk', 'sculpture'],
  },
  {
    id: 'festivals-markets', label: 'Festivals & Markets', slug: 'festivals-markets', emoji: '🎪', color: '#f72585',
    keywords: ['festival', 'fest', 'market', 'farmers market', 'fair', 'parade', 'craft fair', 'celebration', 'bazaar', 'flea', 'pop-up', 'block party', 'oktoberfest'],
  },
  {
    id: 'sports', label: 'Sports', slug: 'sports', emoji: '🏟️', color: '#3a86ff',
    keywords: ['vs', 'vs.', 'game', 'match', 'baseball', 'football', 'soccer', 'basketball', 'hockey', 'braves', 'falcons', 'hawks', 'atlanta united', 'dream', 'wrestling', 'tournament', 'marathon'],
  },
  {
    id: 'comedy-nightlife', label: 'Nightlife & Entertainment', slug: 'nightlife-entertainment', emoji: '🎤', color: '#ffbe0b',
    keywords: ['comedy', 'comedian', 'stand-up', 'standup', 'improv', 'nightlife', 'club', 'drag', 'trivia', 'karaoke', 'party', 'burlesque', 'dance party'],
  },
  {
    id: 'community', label: 'Community & Classes', slug: 'community-classes', emoji: '🤝', color: '#80b918',
    keywords: ['workshop', 'class', 'classes', 'volunteer', 'meetup', 'library', 'lecture', 'talk', 'seminar', 'cleanup', 'clean-up', 'town hall', 'networking', 'book club', 'fundraiser'],
  },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
export const DEFAULT_CATEGORY = 'community'

// Coverage area. `launch: true` cities get top billing in navigation.
// `active: false` cities are recognized but not yet covered: their events are
// skipped and no pages are built. Flip to true to expand (Phase 6).
// `aliases` are neighborhoods / landmarks that map to the city.
const city = (name, county, opts = {}) => ({ name, slug: slugify(name), county, aliases: [], active: true, launch: false, ...opts })

export function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export const CITIES = [
  // Launch cities
  city('Atlanta', 'Fulton/DeKalb', { launch: true, aliases: ['atl', 'midtown atlanta', 'buckhead', 'downtown atlanta', 'old fourth ward', 'inman park', 'east atlanta', 'west end', 'little five points', 'virginia-highland', 'virginia highland', 'grant park', 'west midtown', 'poncey-highland', 'cabbagetown', 'reynoldstown', 'kirkwood', 'castleberry hill', 'piedmont park', 'centennial olympic park'] }),
  city('Decatur', 'DeKalb', { launch: true, aliases: ['oakhurst'] }),
  city('Stone Mountain', 'DeKalb', { launch: true, aliases: ['stone mountain park'] }),
  city('Marietta', 'Cobb', { launch: true }),
  city('Sandy Springs', 'Fulton', { launch: true }),
  city('Tucker', 'DeKalb', { launch: true }),
  city('Lithonia', 'DeKalb', { launch: true, aliases: ['stonecrest', 'arabia mountain'] }),
  city('Clarkston', 'DeKalb', { launch: true }),
  city('Brookhaven', 'DeKalb', { launch: true }),
  city('East Point', 'Fulton', { launch: true }),
  city('College Park', 'Fulton', { launch: true }),
  // Other Metro Atlanta
  city('Dunwoody', 'DeKalb'),
  city('Chamblee', 'DeKalb'),
  city('Doraville', 'DeKalb'),
  city('Alpharetta', 'Fulton', { aliases: ['avalon'] }),
  city('Roswell', 'Fulton'),
  city('Johns Creek', 'Fulton'),
  city('Smyrna', 'Cobb', { aliases: ['the battery atlanta', 'the battery'] }),
  city('Kennesaw', 'Cobb'),
  city('Woodstock', 'Cherokee'),
  city('Canton', 'Cherokee'),
  city('Cumming', 'Forsyth'),
  city('Duluth', 'Gwinnett'),
  city('Suwanee', 'Gwinnett'),
  city('Buford', 'Gwinnett'),
  city('Lawrenceville', 'Gwinnett'),
  city('Peachtree Corners', 'Gwinnett'),
  city('Norcross', 'Gwinnett'),
  city('Snellville', 'Gwinnett'),
  city('Lilburn', 'Gwinnett'),
  city('Fayetteville', 'Fayette'),
  city('Peachtree City', 'Fayette'),
  city('Newnan', 'Coweta'),
  city('McDonough', 'Henry'),
  city('Douglasville', 'Douglas'),
  // Phase 6 expansion (not yet covered)
  city('Athens', 'Clarke', { active: false }),
  city('Gainesville', 'Hall', { active: false }),
  city('Savannah', 'Chatham', { active: false, aliases: ['tybee island'] }),
  city('Augusta', 'Richmond', { active: false }),
  city('Macon', 'Bibb', { active: false }),
  city('Columbus', 'Muscogee', { active: false }),
]

export const ACTIVE_CITIES = CITIES.filter((c) => c.active)

export function cityByName(name) {
  return CITIES.find((c) => c.name === name)
}

export const OTHER_CITY = 'Other Georgia'

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function phraseRegex(phrase) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase.toLowerCase())}($|[^a-z0-9])`, 'i')
}

// Longest names first so "Peachtree City" wins over a shorter match.
const CITY_MATCHERS = CITIES
  .flatMap((c) => [c.name, ...c.aliases].map((term) => ({ city: c.name, term, re: phraseRegex(term) })))
  .sort((a, b) => b.term.length - a.term.length)

export function matchCity(text) {
  if (!text) return null
  for (const m of CITY_MATCHERS) if (m.re.test(text)) return m.city
  return null
}

const CATEGORY_MATCHERS = CATEGORIES.map((c) => ({ id: c.id, res: c.keywords.map(phraseRegex) }))

export function inferCategory(text, fallback = DEFAULT_CATEGORY) {
  if (!text) return fallback
  let best = null
  let bestScore = 0
  for (const c of CATEGORY_MATCHERS) {
    const score = c.res.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0)
    if (score > bestScore) { best = c.id; bestScore = score }
  }
  return best || fallback
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === DEFAULT_CATEGORY)
}
