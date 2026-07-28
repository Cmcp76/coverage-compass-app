import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

const ANIMATION_MS = 900

// Mirrors the compass-green/mint and compass-amber/amberlight CSS variables
// in index.css. Kept as explicit pairs here (rather than reading the CSS
// vars at render time) since this component needs to react immediately to
// theme changes without a DOM read.
const COLORS = {
  light: { good: '#177C5B', goodTrack: '#E1F5EE', review: '#965E13', reviewTrack: '#FAEEDA' },
  dark: { good: '#4CC29A', goodTrack: '#113626', review: '#E0A857', reviewTrack: '#3A2A12' },
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export default function ScoreGauge({ score, size = 176, strokeWidth = 12, children }) {
  const { theme } = useTheme()
  const target = Math.max(0, Math.min(100, score))
  const [animated, setAnimated] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? target : 0,
  )

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setAnimated(target)
      return
    }
    let raf
    const start = performance.now()
    function tick(now) {
      // Clamp both ends: elapsed can come back slightly negative on the
      // first frame (performance.now() and the rAF timestamp aren't
      // always perfectly aligned), which without a floor produced a
      // fleeting negative score on load.
      const progress = Math.min(1, Math.max(0, (now - start) / ANIMATION_MS))
      setAnimated(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animated / 100)
  // Color reflects the final score throughout the animation, not the
  // in-progress animated value, so the ring doesn't flicker between
  // amber and green as it counts up.
  const good = target >= 80
  const palette = COLORS[theme] ?? COLORS.light
  const fill = good ? palette.good : palette.review
  const track = good ? palette.goodTrack : palette.reviewTrack

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fill}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {typeof children === 'function' ? children(animated) : children}
      </div>
    </div>
  )
}
