/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf3',
          100: '#d6f7e0',
          200: '#aeedc3',
          300: '#7bdda1',
          400: '#45c87e',
          500: '#1fae62',
          600: '#128a4d',
          700: '#0f6f40',
          800: '#0f5836',
          900: '#0d4a2e',
          950: '#052a19'
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef1',
          200: '#d5d9df',
          300: '#b1b9c4',
          400: '#8691a1',
          500: '#677284',
          600: '#525c6d',
          700: '#434b59',
          800: '#3a404b',
          900: '#333842',
          950: '#1f2228'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.10)'
      }
    },
  },
  plugins: [],
}
