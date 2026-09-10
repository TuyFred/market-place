/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: '#141414',
        accent: '#1a6b4a',
        soft: '#f3f0ea',
        ink: '#141414',
        forest: '#1a6b4a',
        stone: '#f6f4f0',
        sand: '#e8e2d6',
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'slow-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' }
        }
      },
      animation: {
        'spin-slow': 'spin-slow 10s linear infinite',
        'slow-zoom': 'slow-zoom 22s ease-in-out alternate infinite'
      }
    }
  },
  plugins: []
};
