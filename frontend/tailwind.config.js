/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#fff4eb",
          100: "#ffe3c8",
          200: "#ffc490",
          300: "#ff9f55",
          400: "#ff8022",
          500: "#ff7a09",
          600: "#f05e06",
          700: "#c74307",
          800: "#9e350e",
          900: "#7f2d0f",
        },
      },
    },
  },
  plugins: [],
};
