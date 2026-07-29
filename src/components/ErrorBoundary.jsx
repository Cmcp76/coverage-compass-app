import { Component } from 'react'
import { Link } from 'react-router-dom'

// Dynamic import() rejection messages differ by browser, but all contain
// some form of "module" + "fetch/load/import" language, this catches the
// common real-world trigger: a new deploy replaced this route's
// content-hashed chunk while a user still has the old app shell open.
function isChunkLoadError(error) {
  return /module|chunk/i.test(String(error?.message || '')) && /fetch|load|import/i.test(String(error?.message || ''))
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
          <Link to="/dashboard" className="btn-secondary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
