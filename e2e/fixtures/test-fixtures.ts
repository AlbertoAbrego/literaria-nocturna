import { test as base, expect } from "@playwright/test";
import { getApiBaseURL } from "../helpers/config";
import { isStagingE2E } from "../helpers/env";

// Story 43: capture /api/* browser responses during the test and attach them
// when the test fails, so API-level root causes (status codes, error bodies,
// mocked failures) are readable without replaying traces. Best effort: a body
// still in flight when the test ends stays null, and the log is capped so a
// chatty test cannot bloat the report.
const API_LOG_LIMIT = 100;
const API_BODY_LIMIT = 2_000;

interface CapturedApiResponse {
  method: string;
  url: string;
  status: number;
  body: string | null;
}

// Story 42: the built-in `request` fixture resolves relative /api/... paths
// against `baseURL` (the frontend). That works locally because the Vite dev
// server proxies /api to the backend, but the deployed staging frontend does
// not proxy — the SPA calls the Render API directly. Overriding the fixture
// binds API setup/teardown/contract calls to the backend URL in every mode.
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const apiLog: CapturedApiResponse[] = [];

    page.on("response", (response) => {
      let pathname: string;
      try {
        pathname = new URL(response.url()).pathname;
      } catch {
        return;
      }
      if (!/^\/api(\/|$)/.test(pathname)) return;
      if (apiLog.length >= API_LOG_LIMIT) return;

      const entry: CapturedApiResponse = {
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        body: null,
      };
      apiLog.push(entry);
      response
        .text()
        .then((text) => {
          entry.body = text.slice(0, API_BODY_LIMIT);
        })
        .catch(() => {
          // Response disposed by navigation or a subsequent retry.
        });
    });

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus && apiLog.length > 0) {
      await testInfo.attach("api-responses", {
        body: JSON.stringify(apiLog, null, 2),
        contentType: "application/json",
      });
    }
  },
  request: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL: getApiBaseURL(),
      extraHTTPHeaders: isStagingE2E()
        ? { "X-E2E-Run-ID": process.env.E2E_RUN_ID || "" }
        : {},
    });
    await use(apiContext);
    await apiContext.dispose();
  },
});

export { expect };
export type { Page, APIRequestContext } from "@playwright/test";
