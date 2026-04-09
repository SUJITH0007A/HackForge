/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          bg: "#070A12",
          panel: "#0B1020",
          panel2: "#0F1730",
          line: "rgba(255,255,255,0.08)",
          text: "#EAF0FF",
          muted: "rgba(234,240,255,0.65)",
          accent: "#6D5EF3",
          accent2: "#22D3EE"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(109,94,243,0.35), 0 8px 30px rgba(109,94,243,0.20)"
      }
    }
  },
  plugins: []
};

