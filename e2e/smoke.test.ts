import { test, expect } from "@playwright/test";

test("application loads successfully", async ({ page }) => {
  await page.goto("/");
  // Root redirects to /books via <Navigate to="/books" replace />
  await expect(page).toHaveURL(/\/books$/);
  // Stable application-level condition: main heading "Catalog" exists
  await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
});
