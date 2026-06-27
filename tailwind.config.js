/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#080B10',
          card: '#0F131A',
          cyan: '#00F0FF',
          yellow: '#FFEA00',
          gold: '#FFD700',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'glow-yellow': '0 0 15px rgba(255, 234, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
