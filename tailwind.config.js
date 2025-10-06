/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f3',
          100: '#fce7e9',
          200: '#f9d2d7',
          300: '#f5a9b4',
          400: '#ee7a8b',
          500: '#e24c66',
          600: '#d63555',
          700: '#b62742',
          800: '#722F37',
          900: '#88293e',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4AF37',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
    },
  },
  plugins: [],
};