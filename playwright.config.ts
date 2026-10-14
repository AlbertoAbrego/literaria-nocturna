import { defineConfig, devices } from "@playwright/test";
import { MOBILE_VIEWPORT, TABLET_VIEWPORT } from "./e2e/helpers/viewport";

const isStaging = process.env.E2E_STAGING === "1";
const isCI = !!process.env.CI;
const isExtendedMatrix = process.env.E2E_EXTENDED_MATRIX === "1";

const baseURL = isStaging
  ? process.env.PLAYWRIGHT_BASE_URL ||
    "https://staging.literaria-nocturna.vercel.app"
  : "http://localhost:5173";

const apiBaseURL = isStaging
  ? process.env.PLAYWRIGHT_API_URL ||
    "https://api-staging.literaria-nocturna.render.com"
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
        // Baseline desktop suite runs everything except responsive-only tests,
        // which target the chromium-mobile/chromium-tablet projects.
        grepInvert: /@responsive/,
      },
      {
        name: "chromium-isolated",
        use: { ...devices["Desktop Chrome"] },
        testMatch: "**/empty-catalog.e2e.test.ts",
        dependencies: ["chromium"],
      },
      // Extended matrix (Story 40). Opt-in via E2E_EXTENDED_MATRIX=1 so the
      // default `npm run test:e2e` baseline is unchanged and browser engines
      // other than Chromium are not required locally.
      ...(!isExtendedMatrix
        ? []
        : [
            {
              // Cross-browser critical journeys only (tagged @cross-browser).
              name: "firefox-desktop",
              use: { ...devices["Desktop Firefox"] },
              grep: /@cross-browser/,
              testIgnore: "**/empty-catalog.e2e.test.ts",
            },
            {
              name: "webkit-desktop",
              use: { ...devices["Desktop Safari"] },
              grep: /@cross-browser/,
              testIgnore: "**/empty-catalog.e2e.test.ts",
            },
            // Viewport profiles around the app's only Tailwind breakpoint
            // (sm: 640px). Explicit viewports instead of iPhone/iPad device
            // descriptors, whose built-in sizes and defaultBrowserType do not
            // match these profiles. `isMobile` is deliberately NOT set: under
            // mobile emulation Chromium expands the layout viewport to fit
            // overflowing content (an overflowing catalog table widens
            // window.innerWidth well past the configured viewport), which
            // breaks click geometry on the responsive pages under test.
            {
              name: "chromium-mobile",
              use: {
                ...devices["Desktop Chrome"],
                viewport: MOBILE_VIEWPORT,
                hasTouch: true,
              },
              grep: /@responsive/,
              testIgnore: "**/empty-catalog.e2e.test.ts",
            },
            {
              name: "chromium-tablet",
              use: {
                ...devices["Desktop Chrome"],
                viewport: TABLET_VIEWPORT,
                hasTouch: true,
              },
              grep: /@responsive/,
              testIgnore: "**/empty-catalog.e2e.test.ts",
            },
          ]),
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
