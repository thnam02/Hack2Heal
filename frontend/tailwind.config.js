/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2C2E6F',
        },
        secondary: {
          DEFAULT: '#4DD2C1',
        },
        accent: {
          DEFAULT: '#FF8A73',
        },
      },
    },
  },
  plugins: [],
}

