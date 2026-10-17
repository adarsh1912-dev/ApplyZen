const withVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: withVar('paper'),
        surface: withVar('surface'),
        soft: withVar('soft'),
        ink: withVar('ink'),
        muted: withVar('muted'),
        line: withVar('line'),
        accent: { 50:'#EEF0FF',100:'#E0E3FF',200:'#C7CCFE',600:'#4F46E5',700:'#4338CA',800:'#3730A3' },
      },
      fontFamily: {
        sans: ['Inter','ui-sans-serif','system-ui','sans-serif'],
        serif: ['"IBM Plex Serif"','Georgia','serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,.05), 0 4px 16px -4px rgba(28,25,23,.08)',
        doc: '0 1px 2px rgba(28,25,23,.08), 0 12px 40px -12px rgba(28,25,23,.18)',
      },
      borderRadius: { xl2: '10px' },
    },
  },
  plugins: [],
}
