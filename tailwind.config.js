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
          bg: '#f0f4f8',
          bgSecondary: '#ffffff',
          card: '#ffffff',
          cardGlass: 'rgba(255, 255, 255, 0.4)',
          border: '#e1e8ed',
          borderGlass: 'rgba(255, 255, 255, 0.6)',
          text: '#1a202c',
          textSecondary: '#718096',
          accent: '#4a90e2',
          accentHover: '#357abd',
          accentLight: '#e3f2fd',
          glow: 'rgba(74, 144, 226, 0.3)',
          glowSubtle: 'rgba(200, 200, 255, 0.3)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(200, 200, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(200, 200, 255, 0.2)',
        'glow-lg': '0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(200, 200, 255, 0.4)',
      },
      screens: {
        mobile: '768px',
        desktop: '1024px',
      },
    },
  },
  plugins: [],
}
