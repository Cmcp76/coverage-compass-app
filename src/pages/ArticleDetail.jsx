import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { articles } from '../data/mockData.js'
import { localePath } from '../utils/localeRouting.js'
import NotFound from './NotFound.jsx'

export default function ArticleDetail() {
  const { lang, slug } = useParams()
  const article = articles.find((a) => a.slug === slug)

  useEffect(() => {
    if (!article) return
    document.title = `${article.title} — Coverage Compass`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', article.summary)
  }, [article])

  if (!article) return <NotFound />

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link to={localePath(lang, '/learning-center')} className="text-sm font-medium text-compass-link hover:underline">
        &larr; Back to the Learning Center
      </Link>

      <span className="tag-neutral mt-6 inline-flex">{article.category}</span>
      <h1 className="mt-3 font-display text-2xl font-semibold leading-snug text-compass-heading sm:text-3xl">
        {article.title}
      </h1>
      <p className="mt-3 text-sm text-compass-slate">{article.readTime}</p>

      <div className="prose-article mt-8 space-y-4 text-[15px] leading-relaxed text-compass-ink">
        {article.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {article.keyTakeaways?.length > 0 && (
        <div className="mt-8 rounded-2xl border border-compass-line bg-compass-paper p-6">
          <p className="text-sm font-semibold text-compass-heading">Key takeaways</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-compass-ink">
            {article.keyTakeaways.map((point, i) => (
              <li key={i} className="flex gap-2.5">
                <CheckIcon />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {article.relatedTo && (
        <Link to={localePath(lang, article.relatedTo.to)} className="btn-primary mt-8 inline-flex">
          {article.relatedTo.label}
        </Link>
      )}

      <p className="disclaimer mt-10">
        Articles in the Insurance Learning Center are for general educational purposes only
        and may not reflect the specific terms of your policy or your state's requirements.
        Always refer to your official policy documents and consult a licensed insurance
        professional.
      </p>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-compass-green">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  )
}
