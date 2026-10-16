import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: { 950: "#090818", 900: "#100e2b", 800: "#1a1642", 700: "#272160" },
        dusk: { 400: "#a28cf5", 500: "#8b6cf0", 600: "#6f4fd6" },
        moon: { 100: "#eceefb", 300: "#c9cdea", 500: "#9ea1cc" },
        gold: { 400: "#efd08a", 500: "#e6c479" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
