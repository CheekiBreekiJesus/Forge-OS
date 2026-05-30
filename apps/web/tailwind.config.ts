import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          background: "#0B1120",
          surface: "#111827",
          elevated: "#1F2937",
          border: "#374151",
          foreground: "#F9FAFB",
          muted: "#9CA3AF",
          primary: "#F97316",
          success: "#22C55E",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
