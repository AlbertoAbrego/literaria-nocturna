import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**", "src/test/examples/**"],
    css: false,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/app/**",
        "src/routes/**",
        "src/shared/components/layout/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
      ],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
