/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d1117',
          surface: '#161b22',
          card: '#1b222c',
          border: '#30363d',
          text: '#c9d1d9',
          muted: '#8b949e',
          accent: '#8b5cf6',
          activeTab: '#1f293d',
        },
        brand: {
          purple: '#8b5cf6',
          purpleHover: '#7c3aed',
          pink: '#ec4899',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
