import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { articles, categories } from '../data/mockData.js'
import { localePath } from '../utils/localeRouting.js'

// These 3 terms are the same content as glossaryTerms in mockData.js, kept as
// translation keys here since this preview is the only place that data is
// used (mockData.js's own glossaryTerms export has no other consumer).
const GLOSSARY_PREVIEW_KEYS = ['declarationsPage', 'subrogation', 'endorsement']

export default function LearningCenter() {
  const { t } = useTranslation('common')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const { lang } = useParams()

  const filtered = articles.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      activeCategory === 'All' ||
      a.category.toLowerCase().includes(activeCategory.toLowerCase().split(' ')[0])
    return matchesSearch && matchesCategory
  })

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-compass-heading">
        The Insurance Learning Center
      </h1>
      <p className="mt-2 text-sm text-compass-slate">
        Plain-language guides to help you understand your coverage, no policy upload
        required.
      </p>

      <input
        type="text"
        aria-label="Search Learning Center topics"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Search topics (e.g., "umbrella policy," "actual cash value")'
        className="mt-6 w-full rounded-lg border border-compass-line px-4 py-2.5 text-sm focus:border-compass-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-compass-blue"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === cat
                ? 'bg-compass-blue text-white'
                : 'bg-compass-paper text-compass-slate hover:bg-compass-skyblue'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <details key={a.title} className="card group [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none">
              <span className="tag-neutral">{a.category}</span>
              <p className="mt-3 text-sm font-medium leading-snug text-compass-ink">
                {a.title}
              </p>
              <p className="mt-2 text-xs text-compass-slate">{a.summary}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-compass-slate">{a.readTime}</span>
                <span className="text-xs font-medium text-compass-link group-open:hidden">
                  Read Article →
                </span>
                <span className="hidden text-xs font-medium text-compass-link group-open:inline">
                  Close ↑
                </span>
              </div>
            </summary>
            <p className="mt-3 border-t border-compass-line pt-3 text-xs text-compass-slate">
              Full article reading isn't part of this prototype yet, the summary above
              covers the key points. For the underlying terms, check the glossary
              below or try the related tool in the Tools section.
            </p>
          </details>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-compass-slate">No articles match your search.</p>
        )}
      </div>

      {/* Glossary */}
      <div className="mt-14 rounded-xl bg-compass-paper p-6">
        <p className="text-sm font-medium text-compass-ink">
          Confused by a Term? Look It Up.
        </p>
        <p className="mt-1 text-xs text-compass-slate">
          Insurance is full of words that sound simple but mean something very
          specific.
        </p>
        <div className="mt-4 space-y-4">
          {GLOSSARY_PREVIEW_KEYS.map((key) => (
            <div key={key}>
              <p className="text-sm font-medium text-compass-ink">
                {t(`terms.${key}.term`, { ns: 'glossary' })}
              </p>
              <p className="text-xs text-compass-slate">
                {t(`terms.${key}.definition`, { ns: 'glossary' })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="font-display text-lg font-semibold text-compass-heading">
          Ready to See Your Own Policy in Plain Language?
        </p>
        <Link to={localePath(lang, '/upload')} className="btn-primary mt-4 inline-flex">
          {t('buttons.uploadYourPolicy')}
        </Link>
      </div>

      <p className="disclaimer mt-10">
        Articles in the Insurance Learning Center are for general educational purposes
        only and may not reflect the specific terms of your policy or your state's
        requirements. Always refer to your official policy documents and consult a
        licensed insurance professional.
      </p>
    </div>
  )
}
