import { Component } from 'react'
import { Link } from 'react-router-dom'
import { isChunkLoadError } from '../lib/errorClassification.js'
import { SUPPORTED_LANGUAGE_CODES } from '../i18n/languages.js'
import { localePath } from '../utils/localeRouting.js'

// A class component (required for getDerivedStateFromError/componentDidCatch,
// no hook equivalent exists), so it can't call useParams() — read the
// language straight off window.location.pathname instead. localePath()
// already falls back to the default language for anything unsupported.
function currentLang() {
  const segment = window.location.pathname.split('/')[1]
  return SUPPORTED_LANGUAGE_CODES.includes(segment) ? segment : undefined
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Coverage Compass render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    const chunkError = isChunkLoadError(this.state.error)

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-compass-heading">
          {chunkError ? 'A New Version Is Available' : 'Something Went Wrong'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-compass-slate">
          {chunkError
            ? "This page was updated since you loaded the app. Refresh to get the latest version."
            : "This screen ran into an unexpected error. This is a prototype, so a rough edge like this can happen, refreshing the page usually resolves it."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Refresh the Page
          </button>
          <Link to={localePath(currentLang(), '/dashboard')} className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
