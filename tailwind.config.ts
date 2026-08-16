import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "liquid-drift": {
          "0%": { backgroundPosition: "0% 0%, 100% 100%, 0% 0%" },
          "50%": { backgroundPosition: "30% 20%, 70% 80%, 0% 0%" },
          "100%": { backgroundPosition: "0% 0%, 100% 100%, 0% 0%" },
        },
      },

      colors: {
        black: "#050505",
        ff: {
          bg: "var(--ff-bg)",
          surface: "var(--ff-surface)",
          muted: "var(--ff-muted)",
        },
      },
      borderRadius: {
        ff: "var(--ff-radius)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "liquid-drift": "liquid-drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config