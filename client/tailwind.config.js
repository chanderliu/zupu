/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#f9d7a5',
          300: '#f5bb6d',
          400: '#f09532',
          500: '#ec7a0f',
          600: '#dd600a',
          700: '#b7480c',
          800: '#923911',
          900: '#763011',
          950: '#401605',
        },
      },
    },
  },
  plugins: [],
};
