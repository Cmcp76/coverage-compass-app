// Shared by the browser (assets/app.js) and the daily updater
// (scripts/update-events.mjs), so categories and cities stay in sync.

export const TIMEZONE = 'America/New_York'

// `keywords` drive automatic categorization of feed events. Manual events
// always set their category explicitly.
export const CATEGORIES = [
  {
    id: 'live-music', label: 'Live Music', emoji: '🎸', color: '#ff4d6d',
    keywords: ['concert', 'live music', 'band', 'jazz', 'blues', 'symphony', 'orchestra', 'acoustic', 'singer', 'songwriter', 'hip hop', 'rap', 'bluegrass', 'choir', 'r&b', 'tour', 'dj', 'gospel', 'country music', 'open mic'],
  },
  {
    id: 'family', label: 'Family & Kids', emoji: '🧸', color: '#4cc9f0',
    keywords: ['kids', 'kid', 'family', 'families', 'children', 'storytime', 'story time', 'toddler', 'toddlers', 'all ages', 'puppet', 'teens', 'homeschool', 'trick-or-treat', 'santa', 'egg hunt'],
  },
  {
    id: 'food-drink', label: 'Food & Drink', emoji: '🍑', color: '#ff9e00',
    keywords: ['food', 'wine', 'beer', 'brewery', 'tasting', 'chef', 'cooking', 'brunch', 'bbq', 'barbecue', 'food truck', 'food trucks', 'cocktail', 'cocktails', 'distillery', 'dinner', 'restaurant week'],
  },
  {
    id: 'outdoor', label: 'Outdoor & Nature', emoji: '🌲', color: '#2ec4b6',
    keywords: ['hike', 'hiking', 'trail', 'trails', 'park', 'garden', 'gardens', 'nature', 'bike', 'cycling', '5k', '10k', 'run', 'kayak', 'paddle', 'outdoor', 'outdoors', 'birding', 'beltline', 'lake', 'camping', 'yoga in the park'],
  },
  {
    id: 'arts-theater', label: 'Arts & Theater', emoji: '🎭', color: '#9d4edd',
    keywords: ['art', 'arts', 'gallery', 'exhibit', 'exhibition', 'museum', 'theater', 'theatre', 'ballet', 'dance', 'film', 'movie', 'screening', 'opera', 'poetry', 'musical', 'play', 'art walk', 'sculpture'],
  },
  {
    id: 'festivals-markets', label: 'Festivals & Markets', emoji: '🎪', color: '#f72585',
    keywords: ['festival', 'fest', 'market', 'farmers market', 'fair', 'parade', 'craft fair', 'celebration', 'bazaar', 'flea', 'pop-up', 'block party', 'oktoberfest'],
  },
  {
    id: 'sports', label: 'Sports', emoji: '🏟️', color: '#3a86ff',
    keywords: ['vs', 'vs.', 'game', 'match', 'baseball', 'football', 'soccer', 'basketball', 'hockey', 'braves', 'falcons', 'hawks', 'atlanta united', 'dream', 'wrestling', 'tournament', 'marathon'],
  },
  {
    id: 'comedy-nightlife', label: 'Comedy & Nightlife', emoji: '🎤', color: '#ffbe0b',
    keywords: ['comedy', 'comedian', 'stand-up', 'standup', 'improv', 'nightlife', 'club', 'drag', 'trivia', 'karaoke', 'party', 'burlesque', 'dance party'],
  },
  {
    id: 'community', label: 'Community & Classes', emoji: '🤝', color: '#80b918',
    keywords: ['workshop', 'class', 'classes', 'volunteer', 'meetup', 'library', 'lecture', 'talk', 'seminar', 'cleanup', 'clean-up', 'town hall', 'networking', 'book club', 'fundraiser'],
  },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
export const DEFAULT_CATEGORY = 'community'

// Atlanta metro + nearby cities. `aliases` are neighborhoods or nicknames
// that should map to the city when they appear in a venue/address.
export const CITIES = [
  { name: 'Atlanta', aliases: ['atl', 'midtown atlanta', 'buckhead', 'downtown atlanta', 'old fourth ward', 'inman park', 'east atlanta', 'west end', 'little five points', 'virginia-highland', 'virginia highland', 'grant park', 'west midtown', 'poncey-highland', 'cabbagetown', 'reynoldstown', 'kirkwood', 'castleberry hill'] },
  { name: 'Decatur', aliases: ['oakhurst'] },
  { name: 'Marietta', aliases: [] },
  { name: 'Alpharetta', aliases: ['avalon'] },
  { name: 'Roswell', aliases: [] },
  { name: 'Sandy Springs', aliases: [] },
  { name: 'Dunwoody', aliases: [] },
  { name: 'Brookhaven', aliases: [] },
  { name: 'Chamblee', aliases: [] },
  { name: 'Doraville', aliases: [] },
  { name: 'Tucker', aliases: [] },
  { name: 'Smyrna', aliases: ['the battery atlanta', 'the battery'] },
  { name: 'Kennesaw', aliases: [] },
  { name: 'Woodstock', aliases: [] },
  { name: 'Canton', aliases: [] },
  { name: 'Cumming', aliases: [] },
  { name: 'Johns Creek', aliases: [] },
  { name: 'Duluth', aliases: [] },
  { name: 'Suwanee', aliases: [] },
  { name: 'Buford', aliases: [] },
  { name: 'Lawrenceville', aliases: [] },
  { name: 'Peachtree Corners', aliases: [] },
  { name: 'Norcross', aliases: [] },
  { name: 'Snellville', aliases: [] },
  { name: 'Lilburn', aliases: [] },
  { name: 'Stone Mountain', aliases: [] },
  { name: 'East Point', aliases: [] },
  { name: 'College Park', aliases: [] },
  { name: 'Fayetteville', aliases: [] },
  { name: 'Peachtree City', aliases: [] },
  { name: 'Newnan', aliases: [] },
  { name: 'McDonough', aliases: [] },
  { name: 'Douglasville', aliases: [] },
  { name: 'Athens', aliases: [] },
  { name: 'Gainesville', aliases: [] },
]

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
