import { useEffect, useRef, useState } from 'react'
import { buildSpokenSummary } from '../lib/spokenSummary.js'

// "Explain My Coverage" - reads the plain-language policy summary aloud
// using the browser's built-in SpeechSynthesis API (no external API, no
// cost, works offline). Renders nothing if the browser doesn't support it,
// rather than showing a dead button.
//
// Per this app's brand rule (see the redesign that removed Cece entirely -
// "colorful icons... instead of character images"), the "speaking" state is
// a pulsing icon badge in the same style as the rest of the site's icon
// system, not a mascot/character animation.
export default function ExplainMyCoverage({ analysis }) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState('idle') // idle | playing | paused
  const utteranceRef = useRef(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  // Stop any in-flight speech if the person navigates away mid-playback,
  // rather than leaving audio running against an unmounted page.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  if (!supported) return null

  const sentences = buildSpokenSummary(analysis)

  function play() {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(sentences.join(' '))
    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setStatus('playing')
  }

  function togglePause() {
    if (status === 'playing') {
      window.speechSynthesis.pause()
      setStatus('paused')
    } else if (status === 'paused') {
      window.speechSynthesis.resume()
      setStatus('playing')
    }
  }

  function stop() {
    window.speechSynthesis.cancel()
    setStatus('idle')
  }

  return (
    <div className="mt-6 rounded-2xl border border-compass-line bg-compass-surface p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-compass-purpletint text-compass-purple ${
            status === 'playing' ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        >
          <HeadphonesIcon />
        </span>
        <div>
          <p className="text-sm font-semibold text-compass-heading">Explain My Coverage</p>
          <p className="text-xs text-compass-slate">
            Hear your policy summary read aloud, in plain language.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {status === 'idle' && (
          <button type="button" onClick={play} className="btn-primary">
            <PlayIcon /> Play
          </button>
        )}
        {status !== 'idle' && (
          <>
            <button type="button" onClick={togglePause} className="btn-secondary">
              {status === 'playing' ? (
                <>
                  <PauseIcon /> Pause
                </>
              ) : (
                <>
                  <PlayIcon /> Resume
                </>
              )}
            </button>
            <button type="button" onClick={stop} className="btn-secondary">
              <StopIcon /> Stop
            </button>
          </>
        )}
        {status === 'playing' && (
          <span className="text-xs font-medium text-compass-purple" aria-live="polite">
            Reading…
          </span>
        )}
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-xs font-medium text-compass-link marker:content-none">
          Show transcript
        </summary>
        <div className="mt-2 space-y-2 rounded-lg bg-compass-paper p-3 text-xs leading-relaxed text-compass-ink">
          {sentences.map((sentence, i) => (
            <p key={i}>{sentence}</p>
          ))}
        </div>
      </details>

      <p className="disclaimer mt-4">
        This is an automated, educational summary of your uploaded document — not a
        guarantee of coverage and not a substitute for advice from a licensed insurance
        professional.
      </p>
    </div>
  )
}

function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="2.5" y="14" width="5" height="7" rx="1.6" />
      <rect x="16.5" y="14" width="5" height="7" rx="1.6" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M7 5.5v13l11-6.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  )
}
