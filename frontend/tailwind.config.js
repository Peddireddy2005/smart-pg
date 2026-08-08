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
        // Primary accent — teal, replaces the old aged-brass "brand" scale.
        // Derived from the bright teal band in the dark-theme swatch.
        brand: {
          50: "#E6FBF8",
          100: "#C7F0EA",
          200: "#A3E4DC",
          300: "#74C7BD",
          400: "#3DBDB0",
          500: "#14B8A6",
          600: "#0F9488",
          700: "#0C7A70",
          800: "#0A6058",
          900: "#084A44",
        },
        // Dark-surface scale — from the left (dark) swatch: near-black navy,
        // slate, teal accent, light gray.
        ink: {
          50: "#EEEEEE",
          100: "#DADFE6",
          400: "#6B7280",
          700: "#3A4150",
          800: "#2A303D",
          900: "#232837",
          950: "#1A1F29",
        },
        // Light-surface scale — from the right (light) swatch: pale mint,
        // light cyan, pale teal, medium teal.
        paper: {
          DEFAULT: "#DFFAF6",
          raised: "#F2FCFA",
        },
        mist: {
          50: "#F2FCFA",
          100: "#DFFAF6",
          200: "#C7F0EA",
          300: "#A3E4DC",
          500: "#74C7BD",
          600: "#4FA89C",
        },
        // Kept for any leftover references to the old sage/rust accents.
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