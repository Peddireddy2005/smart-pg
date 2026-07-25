/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "sans-serif"],
        data: ["\"IBM Plex Mono\"", "ui-monospace", "monospace"],
      },
      colors: {
        // Primary accent — aged brass, evokes keys / receipts / property
        // deeds rather than a generic SaaS orange.
        brand: {
          50: "#FBF4E7",
          100: "#F3E3C2",
          200: "#E8CD95",
          300: "#DAB268",
          400: "#C89A48",
          500: "#B8823C",
          600: "#9C6A2E",
          700: "#7C5324",
          800: "#5E3E1B",
          900: "#4A3115",
        },
        // Ledger ink — used for dark surfaces instead of pure slate-950
        ink: {
          50: "#F2F4F2",
          100: "#DEE3DF",
          400: "#5A655D",
          700: "#28322C",
          800: "#1F2822",
          900: "#161E19",
          950: "#0F1512",
        },
        paper: {
          DEFAULT: "#F1EEE5",
          raised: "#FBFAF5",
        },
        sage: {
          50: "#EEF4EF",
          200: "#C6DBC9",
          500: "#3F7A5A",
          600: "#33634A",
        },
        rust: {
          50: "#F8ECE8",
          200: "#E4BFB2",
          500: "#B54A3A",
          600: "#973B2E",
        },
      },
    },
  },
  plugins: [],
};