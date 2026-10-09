/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: 'rgb(var(--c-base-950) / <alpha-value>)',
          900: 'rgb(var(--c-base-900) / <alpha-value>)',
          800: 'rgb(var(--c-base-800) / <alpha-value>)',
          700: 'rgb(var(--c-base-700) / <alpha-value>)',
          600: 'rgb(var(--c-base-600) / <alpha-value>)',
        },
        ember: {
          400: '#F0895A',
          500: '#E8622C',
          600: '#C94E20',
          700: '#A62639',
        },
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        risk: {
          low: '#3F8F6F',
          moderate: '#C99327',
          high: '#D9672E',
          extreme: '#C23B3B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
