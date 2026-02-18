/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold':          '#EFB50B',
        'brand-gold-dark':     '#C99409',
        'brand-charcoal':      '#4B4D4F',
        'brand-charcoal-dark': '#2A2B2D',
        'brand-gray-soft':     '#F6F6F7',
      },
      fontFamily: {
        display: ['Urbanist', 'system-ui', 'sans-serif'],
        body:    ['Onest', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        nav:        '0 -1px 3px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};