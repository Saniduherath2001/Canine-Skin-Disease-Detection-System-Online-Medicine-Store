/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-orange": "#F58634", // Approximate from logo/button
        "brand-dark": "#2D2D2D",
        "brand-gray": "#888888",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        afacad: ["Afacad", "sans-serif"],
        abel: ["Abel", "sans-serif"],
        inria: ["'Inria Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
