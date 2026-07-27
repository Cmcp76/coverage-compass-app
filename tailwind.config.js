/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        compass: {
          navy: '#0C2340',
          blue: '#1D5FA6',
          skyblue: '#E6F1FB',
          green: '#177C5B',
          mint: '#E1F5EE',
          amber: '#965E13',
          amberlight: '#FAEEDA',
          ink: '#1A2433',
          slate: '#5B6675',
          line: '#E3E8EF',
          paper: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(12, 35, 64, 0.06), 0 1px 1px rgba(12,35,64,0.04)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
