// Recharts takes raw colors via props/inline styles, not Tailwind classes,
// so it can't pick up the CSS-variable-driven theme automatically the way
// the rest of the app does. These mirror the compass-* CSS variables in
// index.css for the specific values the two bar charts need.
const CHART_COLORS = {
  light: {
    good: '#177C5B',
    review: '#965E13',
    grid: '#E3E8EF',
    tick: '#5B6675',
    tooltipBg: '#FFFFFF',
    tooltipBorder: '#E3E8EF',
    tooltipText: '#1A2433',
  },
  dark: {
    good: '#4CC29A',
    review: '#E0A857',
    grid: '#3A4D68',
    tick: '#98A6BA',
    tooltipBg: '#1A2D48',
    tooltipBorder: '#3A4D68',
    tooltipText: '#E7EDF5',
  },
}

export function getChartColors(theme) {
  return CHART_COLORS[theme] ?? CHART_COLORS.light
}
