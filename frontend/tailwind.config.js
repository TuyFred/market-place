/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        accent: '#f97316',
        soft: '#fef3c7'
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif']
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        'spin-slow': 'spin-slow 10s linear infinite'
      }
    }
  },
  plugins: []
};

