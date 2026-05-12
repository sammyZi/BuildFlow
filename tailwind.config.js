/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#f8f9fa',
          card: '#ffffff',
          border: '#e9ecef',
          text: '#212529',
          textSecondary: '#6c757d',
          accent: '#4a90e2',
          accentHover: '#357abd',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(74, 144, 226, 0.3)',
        'glow-sm': '0 0 10px rgba(74, 144, 226, 0.2)',
      },
      screens: {
        mobile: '768px',
        desktop: '1024px',
      },
    },
  },
  plugins: [],
}
