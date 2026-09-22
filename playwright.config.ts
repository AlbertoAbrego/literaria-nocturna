import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/empty-catalog.e2e.test.ts",
    },
    {
      name: "chromium-isolated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/empty-catalog.e2e.test.ts",
      dependencies: ["chromium"],
    },
  ],
  webServer: [
    {
      command: "npm run dev --prefix backend",
      url: "http://localhost:3000/api/health/ready",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev --prefix frontend",
      url: "http://localhost:5173",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
