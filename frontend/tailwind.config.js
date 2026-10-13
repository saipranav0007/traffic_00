/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#111827',
          900: '#0B1120',
          950: '#060A12',
        },
        brand: {
          50: '#E0F2FE',
          100: '#BAE6FD',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        traffic: {
          green: '#10B981',
          yellow: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          gray: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(14, 165, 233, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 25px -5px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
