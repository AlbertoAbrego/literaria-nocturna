import { test as base, expect } from "@playwright/test";
import { getApiBaseURL } from "../helpers/config";
import { isStagingE2E } from "../helpers/env";

// Story 42: the built-in `request` fixture resolves relative /api/... paths
// against `baseURL` (the frontend). That works locally because the Vite dev
// server proxies /api to the backend, but the deployed staging frontend does
// not proxy — the SPA calls the Render API directly. Overriding the fixture
// binds API setup/teardown/contract calls to the backend URL in every mode.
export const test = base.extend({
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
