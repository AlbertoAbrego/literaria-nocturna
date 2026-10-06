import { defineConfig, devices } from "@playwright/test";

const isStaging = process.env.E2E_STAGING === "1";
const isCI = !!process.env.CI;

const baseURL = isStaging
  ? process.env.PLAYWRIGHT_BASE_URL || "https://staging.literaria-nocturna.vercel.app"
  : "http://localhost:5173";

const apiBaseURL = isStaging
  ? process.env.PLAYWRIGHT_API_URL || "https://api-staging.literaria-nocturna.render.com"
  : "http://localhost:3000";

const projects = isStaging
  ? [
      {
        name: "chromium-staging",
        use: { ...devices["Desktop Chrome"] },
        testIgnore: "**/empty-catalog.e2e.test.ts",
      },
      {
        name: "chromium-staging-isolated",
        use: { ...devices["Desktop Chrome"] },
        testMatch: "**/empty-catalog.e2e.test.ts",
        dependencies: ["chromium-staging"],
      },
    ]
  : [
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
    ];

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: "list",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: isStaging
      ? { "X-E2E-Run-ID": process.env.E2E_RUN_ID || "" }
      : {},
  },
  projects,
  webServer: isStaging
    ? []
    : [
        {
          command: "npm run dev --prefix backend",
          url: `${apiBaseURL}/api/health/ready`,
          timeout: 60_000,
          reuseExistingServer: !isCI,
          env: {
            RATE_LIMIT_MAX: "10000",
          },
        },
        {
          command: "npm run dev --prefix frontend",
          url: baseURL,
          timeout: 60_000,
          reuseExistingServer: !isCI,
        },
      ],
});
