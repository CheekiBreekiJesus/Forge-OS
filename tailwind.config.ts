import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: {
          page: "var(--forge-page-bg)",
          sidebar: "var(--forge-sidebar-bg)",
          topbar: "var(--forge-topbar-bg)",
          surface: "var(--forge-surface)",
          elevated: "var(--forge-surface-elevated)",
          border: "var(--forge-border)",
          "text-primary": "var(--forge-text-primary)",
          "text-secondary": "var(--forge-text-secondary)",
          "text-muted": "var(--forge-text-muted)",
          orange: "var(--forge-accent-orange)",
          blue: "var(--forge-accent-blue)",
          success: "var(--forge-success)",
          warning: "var(--forge-warning)",
          danger: "var(--forge-danger)",
          info: "var(--forge-info)"
        }
      },
      boxShadow: {
        "soft-border": "var(--forge-shadow-soft)"
      }
    }
  },
  plugins: []
};

export default config;
