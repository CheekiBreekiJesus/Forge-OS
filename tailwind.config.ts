import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          ink: "#172033",
          panel: "#f5f7fa",
          line: "#d8dee8",
          accent: "#2563eb",
          steel: "#44546a",
          success: "#17803d",
          warning: "#b7791f"
        }
      },
      boxShadow: {
        "soft-border": "0 1px 0 rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
