/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08121f',
        mint: '#3dd9b4',
        sand: '#f4d58d',
      },
      boxShadow: {
        glow: '0 0 40px rgba(61, 217, 180, 0.25)',
      },
    },
  },
  plugins: [],
};
