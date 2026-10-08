// Every listing page on the site, shared by the page builder
// (scripts/build-site.mjs) and the browser (assets/app.js). A page's
// `preset` is its starting filter set; visitors can still change filters.
import { CATEGORIES, ACTIVE_CITIES } from './taxonomy.js'

const AREA = 'Atlanta & Georgia'

export const CORE_SECTIONS = [
  {
    key: 'today', path: '/today/', nav: 'Today', emoji: '☀️',
    title: `Things to Do Today in ${AREA}`,
    h1: 'Things to do today',
    description: 'Events happening today around Atlanta and nearby Georgia cities: concerts, festivals, family fun, food and free things to do.',
    preset: { when: 'today' },
  },
  {
    key: 'tomorrow', path: '/tomorrow/', nav: 'Tomorrow', emoji: '🌅',
    title: `Things to Do Tomorrow in ${AREA}`,
    h1: 'Things to do tomorrow',
    description: 'Plan ahead with events happening tomorrow across Metro Atlanta: live music, festivals, food events, outdoor adventures and more.',
    preset: { when: 'tomorrow' },
  },
  {
    key: 'weekend', path: '/this-weekend/', nav: 'This Weekend', emoji: '🎉',
    title: 'Things to Do in Atlanta This Weekend',
    h1: 'Things to do this weekend',
    description: 'Friday through Sunday events in Atlanta, Decatur, Marietta, Sandy Springs and nearby. Free and paid, with official links and ticket info.',
    preset: { when: 'weekend' },
  },
  {
    key: 'free', path: '/free/', nav: 'Free Events', emoji: '🆓',
    title: 'Free Events & Free Things to Do in Atlanta',
    h1: 'Free events',
    description: 'Free concerts, festivals, family activities and outdoor events around Atlanta and Metro Georgia. Only events confirmed as free admission.',
    preset: { when: 'month', price: 'free' },
  },
  {
    key: 'date-night', path: '/date-night/', nav: 'Date Night', emoji: '💕',
    title: 'Date Night Ideas in Atlanta',
    h1: 'Date night ideas',
    description: 'Evening concerts, comedy, theater, food and nightlife events in Atlanta for your next date night.',
    intro: 'Evening events (5 PM or later) in music, arts & theater, food & dining, and nightlife. Pulled from the same verified listings as the rest of the site.',
    preset: { when: 'month', dateNight: true },
  },
]

// Category pages. "Festivals & Community Events" combines two categories.
export const CATEGORY_PAGES = [
  pageForCats('concerts-live-music', 'Concerts & Live Music', '🎸', ['live-music'], 'Concerts and live music in Atlanta', 'Concerts, live bands, jazz, hip hop, symphony and open mics around Atlanta and Metro Georgia.'),
  pageForCats('festivals-community-events', 'Festivals & Community Events', '🎪', ['festivals-markets', 'community'], 'Festivals and community events in Georgia', 'Festivals, markets, parades, block parties, workshops and community events across Metro Atlanta.'),
  pageForCats('food-dining', 'Food & Dining Events', '🍑', ['food-drink'], 'Food and drink events in Atlanta', 'Food festivals, tastings, brewery events, food trucks and dining events around Atlanta.'),
  pageForCats('nightlife-entertainment', 'Nightlife & Entertainment', '🎤', ['comedy-nightlife'], 'Nightlife and entertainment in Atlanta', 'Comedy shows, trivia, karaoke, dance parties and nightlife events in Atlanta.'),
  pageForCats('family-kids', 'Family & Kids', '🧸', ['family'], 'Family activities in Georgia', 'Kid-friendly and family activities around Atlanta: storytimes, festivals, museums, outdoor fun and more.'),
  pageForCats('outdoor-adventures', 'Outdoor Adventures', '🌲', ['outdoor'], 'Outdoor events and adventures near Atlanta', 'Hikes, runs, park events, paddling, gardens and outdoor activities around Metro Atlanta.'),
  pageForCats('arts-theater', 'Arts & Theater', '🎭', ['arts-theater'], 'Arts and theater events in Atlanta', 'Theater, museums, gallery openings, film screenings, dance and art walks in Atlanta.'),
  pageForCats('sports', 'Sports', '🏟️', ['sports'], 'Sports events in Atlanta', 'Atlanta pro, college and community sports events and races.'),
]

function pageForCats(slug, nav, emoji, cats, h1, description) {
  return {
    key: `cat-${slug}`, path: `/${slug}/`, nav, emoji,
    title: `${nav} in ${AREA}`,
    h1: h1.charAt(0).toUpperCase() + h1.slice(1),
    description,
    preset: { when: 'month', cats },
  }
}

export const CITY_PAGES = ACTIVE_CITIES.flatMap((c) => [
  {
    key: `city-${c.slug}`, path: `/${c.slug}/`, nav: c.name, city: c, launch: c.launch,
    title: `Things to Do in ${c.name}, GA: Upcoming Events`,
    h1: `Things to do in ${c.name}`,
    description: `Upcoming events in ${c.name}, Georgia: concerts, festivals, family activities, food events and free things to do.`,
    preset: { when: 'month', city: c.name },
  },
  {
    key: `city-${c.slug}-free`, path: `/${c.slug}/free/`, nav: `Free in ${c.name}`, city: c, cityFree: true,
    title: `Free Things to Do in ${c.name}, GA`,
    h1: `Free things to do in ${c.name}`,
    description: `Free events and free things to do in ${c.name}, Georgia, confirmed as free admission and linked to the official source.`,
    preset: { when: 'month', city: c.name, price: 'free' },
  },
])

export const CALENDAR_PAGE = {
  key: 'calendar', path: '/calendar/', nav: 'Calendar', emoji: '📅',
  title: `Event Calendar: ${AREA}`,
  h1: 'Event calendar',
  description: 'Browse upcoming Atlanta and Georgia events by date on a monthly calendar.',
  preset: { when: 'all', view: 'calendar' },
}

export const HOME_PAGE = {
  key: 'home', path: '/', nav: 'Home',
  title: 'Georgia Weekend Finder: Things to Do in Atlanta This Weekend',
  h1: 'Your Georgia weekend, sorted.',
  description: 'Free and paid things to do in Atlanta and nearby Georgia cities. Concerts, festivals, family activities, food events, outdoor adventures and date night ideas.',
  preset: { when: 'weekend' },
}

export const LISTING_PAGES = [HOME_PAGE, ...CORE_SECTIONS, CALENDAR_PAGE, ...CATEGORY_PAGES, ...CITY_PAGES]

export const DATE_NIGHT_CATEGORIES = ['live-music', 'arts-theater', 'food-drink', 'comedy-nightlife']

export function categoryPageFor(categoryId) {
  return CATEGORY_PAGES.find((p) => p.preset.cats.includes(categoryId))
}

export { CATEGORIES }
