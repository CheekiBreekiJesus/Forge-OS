import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@cup-customizer": path.resolve(__dirname, "packages/cup-customizer/index.ts")
    }
  },
  test: {
    environment: "node"
  }
});
