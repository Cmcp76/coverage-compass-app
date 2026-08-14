/** @type {import('tailwindcss').Config} */

// Colors are defined as CSS custom properties (space-separated RGB triples,
// see index.css) so a single `.dark` class flips every semantic color at
// once, rather than needing a `dark:` variant on every element. The function
// form (rather than a plain `rgb(var(...))` string) is required for Tailwind
// to keep supporting opacity modifiers like `bg-compass-skyblue/40`.
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${varName}))`
      : `rgb(var(${varName}) / ${opacityValue})`
}

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        compass: {
          // Fixed in both themes: always paired with white text (solid
          // badges, buttons), so they don't need to track the page
          // background at all.
          navy: withOpacity('--color-compass-navy'),
          blue: withOpacity('--color-compass-blue'),
          // Theme-aware.
          heading: withOpacity('--color-compass-heading'),
          link: withOpacity('--color-compass-link'),
          skyblue: withOpacity('--color-compass-skyblue'),
          green: withOpacity('--color-compass-green'),
          mint: withOpacity('--color-compass-mint'),
          amber: withOpacity('--color-compass-amber'),
          amberlight: withOpacity('--color-compass-amberlight'),
          ink: withOpacity('--color-compass-ink'),
          slate: withOpacity('--color-compass-slate'),
          line: withOpacity('--color-compass-line'),
          paper: withOpacity('--color-compass-paper'),
          surface: withOpacity('--color-compass-surface'),
          // Decorative accents (card icons, gradients) - fixed across themes,
          // see the comment above these vars in index.css.
          teal: withOpacity('--color-compass-teal'),
          tealtint: withOpacity('--color-compass-tealtint'),
          purple: withOpacity('--color-compass-purple'),
          purpletint: withOpacity('--color-compass-purpletint'),
          coral: withOpacity('--color-compass-coral'),
          coraltint: withOpacity('--color-compass-coraltint'),
          gold: withOpacity('--color-compass-gold'),
          goldtint: withOpacity('--color-compass-goldtint'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(12, 35, 64, 0.06), 0 1px 1px rgba(12,35,64,0.04)',
        lift: '0 20px 45px -20px rgba(15, 23, 55, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
    },
  },
  plugins: [],
}
