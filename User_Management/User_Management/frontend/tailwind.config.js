/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A1A',
        night: '#2F3131',
        brand: '#FDB813',
        brandDark: '#7C5800',
        route: '#0052CC',
        emerald: '#10B981',
        mist: '#F9F9F9'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 55px rgba(15, 23, 42, 0.10)'
      }
    }
  },
  plugins: []
};
