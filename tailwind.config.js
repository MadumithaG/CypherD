/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['ui-sans-serif','system-ui'] },
      colors: { brand: { DEFAULT: '#06b6d4' } }
    }
  },
  plugins: []
}
