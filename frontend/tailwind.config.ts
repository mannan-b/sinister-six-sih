import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#050505",
        "surface-raised": "#121212",
        "surface-hover": "#18181b",
        border: "#27272a",
        "border-subtle": "#18181b",
        
        nexus: {
          50: "#ffffff",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        
        // Monochrome Risk palette
        risk: {
          low: "#71717a",
          moderate: "#a1a1aa",
          high: "#e4e4e7",
          critical: "#ffffff",
        }
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(255, 255, 255, 0.1)",
      }
    },
  },
  plugins: [],
};

export default config;
