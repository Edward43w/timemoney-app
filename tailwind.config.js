/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
        },
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        accent: {
          green: '#10b981',
          red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}