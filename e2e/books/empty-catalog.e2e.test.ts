import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import { deleteAllBooks } from "../helpers/api";

test.describe("Empty Catalog", () => {
  test.beforeEach(async ({ request }) => {
    await deleteAllBooks(request);
  });

  test("TC-H36-011: empty catalog shows empty state", async ({ page }) => {
    await gotoCatalog(page);

    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(
      page.getByText("No volumes have been cataloged yet."),
    ).toBeVisible();
  });
});
