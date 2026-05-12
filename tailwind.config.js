/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        chat: {
          sidebar1: '#F9FAFB', // gray-50
          sidebar2: '#FFFFFF', // white
          main: '#FFFFFF',
          border: '#E5E7EB', // gray-200
          text: '#374151', // gray-700
          textMuted: '#6B7280', // gray-500
          accent: '#6366F1', // indigo-500
          accentHover: '#4F46E5', // indigo-600
          bubbleUser: '#F3F4F6', // gray-100
          bubbleAi: '#FFFFFF', // white
        }
      },
    },
  },
  plugins: [],
}
