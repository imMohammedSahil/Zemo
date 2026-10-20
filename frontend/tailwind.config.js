/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zemo: {
          bg: "#000000",         // Pitch Black Base
          card: "#0E2A1B",       // Midnight Pine
          cardHover: "#133824",  // Active Spruce
          border: "#163E26",     // Deep Pine Border
          borderHover: "#CEFF00",// Acid Highlight Ring
          primary: "#CEFF00",    // Acid Chartreuse
          primaryHover: "#D4FF1A",
          neon: "#CEFF00",       // Acid Glow
          pine: "#0E2A1B",       // Midnight Pine
          stone: "#EAE5D9",      // Warm Travertine
          stoneMuted: "#A6A095", // Travertine Muted
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}