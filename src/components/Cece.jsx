import { useEffect, useRef, useState } from 'react'

// Hosted externally (not committed to this repo) - swap for a repo-hosted
// asset (e.g. import from src/assets) if this needs to stop depending on a
// third-party host staying up.
const CECE_PHOTO_URL = 'https://i.postimg.cc/hGdh2KZJ/1bb2fe62-19a2-41e8-a0dd-3f1ca1424610.png'

// Cece — Coverage Compass mascot. Colors below reference the app's actual
// --color-compass-* CSS variables (see index.css) rather than fixed hex, so
// she stays on-brand and (for the tokens that vary by theme) adapts to dark
// mode instead of carrying her own separate, unbranded palette.
const COLORS = {
  blue: 'rgb(var(--color-compass-blue))',
  navy: 'rgb(var(--color-compass-navy))',
  glow: 'rgb(var(--color-compass-blue) / 0.45)',
  green: 'rgb(var(--color-compass-green))',
  heading: 'rgb(var(--color-compass-heading))',
  amber: 'rgb(var(--color-compass-amber))',
  amberLight: 'rgb(var(--color-compass-amberlight))',
}

// Per-state configuration: label, default message, tablet icon, animation class.
const STATE_CONFIG = {
  idle: {
    label: 'Idle',
    message: "Hi, I'm Cece. Upload a policy and I'll walk you through it.",
    icon: 'compass',
    bodyClass: 'cece-float',
    glow: false,
  },
  welcome: {
    label: 'Welcome',
    message: "Hi there! I'm Cece — I'll help you understand your policy.",
    icon: 'wave',
    bodyClass: 'cece-wave',
    glow: false,
  },
  reading: {
    label: 'Reading',
    message: 'Got it! Reading through your policy now...',
    icon: 'page',
    bodyClass: 'cece-float',
    glow: false,
  },
  analyzing: {
    label: 'Analyzing',
    message: 'Looking closely at your coverage and limits...',
    icon: 'magnifier',
    bodyClass: 'cece-pulse',
    glow: true,
  },
  teaching: {
    label: 'Teaching',
    message: "Here's what that means, in plain language.",
    icon: 'bulb',
    bodyClass: 'cece-float',
    glow: true,
  },
  complete: {
    label: 'Complete',
    message: 'All done! Here’s your Coverage Compass report.',
    icon: 'check',
    bodyClass: 'cece-bounce-in',
    glow: false,
  },
}

// Rotating tip copy per phase, matching the AI Policy Review Experience beats.
const TIP_SETS = {
  reading: [
    'Reading your policy...',
    'Finding your coverage limits...',
    'Reviewing your deductibles...',
  ],
  analyzing: [
    'Looking for areas you may want to review...',
    'Comparing this to common coverage patterns...',
    'Weighing your liability and property protection...',
  ],
  teaching: [
    'Endorsements are just changes made to your base policy.',
    'Actual cash value and replacement cost pay out differently after a claim.',
    'A higher deductible usually means a lower premium — but more out of pocket if you file.',
  ],
  complete: [
    'Preparing your Coverage Compass report...',
    'Your report is ready to download below.',
  ],
  idle: ["I'm here whenever you have a question."],
  welcome: ["Let's see what's actually in your policy."],
}

/**
 * useCeceTips — rotates through the tip lines for a given phase every `intervalMs`.
 * Returns the current tip string. Resets to the first tip whenever `phase` changes.
 */
export function useCeceTips(phase, intervalMs = 3200) {
  const tips = TIP_SETS[phase] || TIP_SETS.idle
  const [index, setIndex] = useState(0)
  const phaseRef = useRef(phase)

  useEffect(() => {
    if (phaseRef.current !== phase) {
      phaseRef.current = phase
      setIndex(0)
    }
  }, [phase])

  useEffect(() => {
    if (tips.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % tips.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [tips, intervalMs])

  return tips[index]
}

const SIZE_MAP = { sm: 64, md: 96, lg: 140, xl: 200, '2xl': 260 }

// The small icon Cece holds up on her tablet, swapped per state.
function CeceIcon({ icon }) {
  switch (icon) {
    case 'page':
      return (
        <g>
          <rect x="-9" y="-11" width="18" height="22" rx="2" fill="white" opacity="0.95" />
          <line x1="-5" y1="-5" x2="5" y2="-5" stroke={COLORS.blue} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="-5" y1="0" x2="5" y2="0" stroke={COLORS.blue} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="-5" y1="5" x2="1" y2="5" stroke={COLORS.blue} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )
    case 'magnifier':
      return (
        <g>
          <circle cx="-2" cy="-3" r="7" fill="none" stroke="white" strokeWidth="2.4" />
          <line x1="3" y1="2" x2="9" y2="8" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )
    case 'bulb':
      return (
        <g>
          <circle cx="0" cy="-4" r="7" fill={COLORS.amberLight} stroke="white" strokeWidth="1.2" />
          <rect x="-3" y="3" width="6" height="4" rx="1" fill="white" />
          <line x1="-2" y1="9" x2="2" y2="9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )
    case 'check':
      return (
        <g>
          <circle cx="0" cy="0" r="9" fill={COLORS.green} opacity="0.95" />
          <path d="M -4 0 L -1 3.5 L 5 -3.5" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'wave':
    case 'compass':
    default:
      return (
        <g>
          <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.6" />
          <path d="M -3.5 -3.5 L 0 0 L -1 3.5 Z" fill={COLORS.green} />
          <path d="M 3.5 3.5 L 0 0 L 1 -3.5 Z" fill={COLORS.heading} />
        </g>
      )
  }
}

/**
 * Cece — the animated mascot. Renders her photo + optional speech bubble.
 *
 * Props:
 *   state    'idle' | 'welcome' | 'reading' | 'analyzing' | 'teaching' | 'complete'
 *   message  optional override for the speech bubble text (defaults to the state's copy)
 *   size     'sm' | 'md' | 'lg' | 'xl' | '2xl'  (default 'md')
 *   showBubble  boolean, default true
 *   name     display name in the bubble tail, default 'Cece'
 */
export default function Cece({ state = 'idle', message, size = 'md', showBubble = true, name = 'Cece', className = '' }) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle
  const px = SIZE_MAP[size] || SIZE_MAP.md
  const bubbleText = message || config.message

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <style>{`
        @keyframes cece-float-kf {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes cece-wave-kf {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes cece-pulse-kf {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes cece-glow-kf {
          0%, 100% { filter: drop-shadow(0 0 2px ${COLORS.glow}); }
          50% { filter: drop-shadow(0 0 10px ${COLORS.glow}); }
        }
        @keyframes cece-bounce-in-kf {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
        .cece-float { animation: cece-float-kf 2.6s ease-in-out infinite; }
        .cece-wave { animation: cece-wave-kf 1.4s ease-in-out infinite; transform-origin: 50% 90%; }
        .cece-pulse { animation: cece-float-kf 2.6s ease-in-out infinite, cece-pulse-kf 1.6s ease-in-out infinite; }
        .cece-bounce-in { animation: cece-bounce-in-kf 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
        .cece-glow-ring { animation: cece-glow-kf 1.8s ease-in-out infinite; }
        .cece-bubble-in { animation: cece-bounce-in-kf 0.4s ease-out both; }
      `}</style>

      <div className={`relative ${config.bodyClass}`} style={{ width: px }} aria-hidden="true">
        <img
          src={CECE_PHOTO_URL}
          alt=""
          className={`w-full rounded-2xl object-contain ${config.glow ? 'cece-glow-ring' : ''}`}
        />
        {/* Small state badge, bottom-right of the photo - carries the same
            per-state signal the tablet icon used to on the illustrated body. */}
        <span
          className="absolute bottom-1 right-1 flex items-center justify-center rounded-full border-2 border-white"
          style={{ width: px * 0.3, height: px * 0.3, background: COLORS.navy }}
        >
          <svg viewBox="-12 -12 24 24" width="72%" height="72%">
            <CeceIcon icon={config.icon} />
          </svg>
        </span>
      </div>

      {showBubble && (
        <div key={bubbleText} className="cece-bubble-in relative mt-1 max-w-xs">
          <div className="rounded-2xl rounded-tl-sm border border-compass-line bg-compass-surface px-4 py-2.5 shadow-card">
            <p className="mb-0.5 text-xs font-semibold text-compass-link">{name}</p>
            <p className="text-sm leading-snug text-compass-ink">{bubbleText}</p>
          </div>
        </div>
      )}
    </div>
  )
}
