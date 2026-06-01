export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Outfit'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#ffefd3",
          200: "#ffd99f",
          300: "#ffbc62",
          400: "#ff9728",
          500: "#ff7a09",
          600: "#f05e06",
          700: "#c74307",
          800: "#9e350e",
          900: "#7f2d0f",
        },
        slate: {
          750: "#293548",
          850: "#1a2537",
          950: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};