// Quality checks for automated (feed) events. Anything questionable is
// either HELD (not published until you approve it) or FLAGGED (published,
// but listed in data/review-queue.json for a quick look).
import { OTHER_CITY } from '../../assets/taxonomy.js'

const HOLD_TITLE = /\b(cancel+ed|postponed|rescheduled|tba|tbd|private event|members only|test event)\b/i

export function reviewEvent(e) {
  const hold = []
  const flags = []
  if (HOLD_TITLE.test(e.title)) hold.push('Title suggests cancelled, postponed, private or placeholder')
  if (!e.venue && !e.address) hold.push('No venue or address')
  if (e.title.replace(/[^a-z0-9]/gi, '').length < 4) hold.push('Title too short to be meaningful')
  if (/^[^a-z]*$/.test(e.title) && e.title.length > 20) flags.push('Title is all caps')
  if (e.price?.isFree == null) flags.push('Admission price unknown (shows "See official site")')
  if (e.city === OTHER_CITY) flags.push('City not recognized')
  if (e.source?.url && e.url === e.source.url) flags.push('No event-specific link (points to the source homepage)')
  if (e.end && new Date(e.end) - new Date(e.start) > 45 * 86400000) flags.push('Runs longer than 45 days (exhibit or ongoing listing?)')
  return { hold, flags }
}

function words(title) {
  return new Set(title.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2))
}

// Possible duplicates across sources: same day, same city, very similar title.
export function findNearDuplicates(events) {
  const pairs = []
  const byDay = new Map()
  for (const e of events) {
    const key = `${e.start.slice(0, 10)}|${e.city}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key).push(e)
  }
  for (const group of byDay.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = words(group[i].title)
        const b = words(group[j].title)
        const inter = [...a].filter((w) => b.has(w)).length
        const union = new Set([...a, ...b]).size
        if (union && inter / union >= 0.6) pairs.push([group[i], group[j]])
      }
    }
  }
  return pairs
}

// Refuse to publish a run that suddenly loses most events (usually a broken
// feed or parser), so a bad night never empties the site.
export function healthCheck(previousCount, nextCount) {
  if (previousCount >= 20 && nextCount < previousCount * 0.3) {
    return `Event count dropped from ${previousCount} to ${nextCount}. Not publishing. Check the source errors above, or rerun with --force if this is expected.`
  }
  return null
}
