import { test, expect } from "@playwright/test";

test("placeholder — infrastructure verification", async ({ page }) => {
  await expect(page).toBeDefined();
});
