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
        'line-strong': withVar('line-strong'),
        success: withVar('success'),
        warning: withVar('warning'),
        danger: withVar('danger'),
        accent: {
          50: '#F0F5F1',
          100: '#DDEBE1',
          200: '#BCD7C5',
          300: '#91BA9F',
          400: '#629678',
          500: '#3F7559',
          600: '#245743',
          700: '#1D4636',
          800: '#17382B',
          900: '#122C22',
          950: '#091A14',
          foreground: '#FFFFFF',
        },
        clay: {
          50: '#F8F1E7',
          100: '#F0E2CF',
          200: '#E3C9A9',
          500: '#B88A58',
          600: '#A27645',
          700: '#845D35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,25,22,.04), 0 12px 32px -20px rgba(23,25,22,.18)',
        doc: '0 2px 4px rgba(23,25,22,.06), 0 24px 60px -24px rgba(23,25,22,.24)',
        float: '0 4px 10px rgba(23,25,22,.06), 0 30px 70px -30px rgba(23,25,22,.28)',
        inset: 'inset 0 1px 2px rgba(23,25,22,.04)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
