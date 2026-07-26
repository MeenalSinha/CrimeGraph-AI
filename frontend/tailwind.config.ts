import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#060a0f", // Very dark outer bg
        panel: "#0b121c", // Dark panel bg
        panel2: "#0f1724", // Slightly lighter panel bg
        line: "#1e2a3b", // Panel borders
        accent: "#e57231", // Primary orange
        accent2: "#d35400", // Darker orange
        blue: "#2b70b4", // Muted cyan/blue
        blue2: "#194a7a", // Darker blue
        muted: "#5a6a7e", // Muted text
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(229,114,49,0.25)",
        blueglow: "0 0 24px rgba(43,112,180,0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
