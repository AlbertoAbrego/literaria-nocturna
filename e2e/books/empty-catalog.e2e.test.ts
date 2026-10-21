import { test, expect } from "../fixtures/test-fixtures";
import { gotoCatalog } from "../helpers/navigation";
import { deleteAllBooks } from "../helpers/api";
import { isStagingE2E } from "../helpers/env";

test.describe("Empty Catalog", () => {
  // Story 42 AC6: this suite empties the ENTIRE catalog before asserting the
  // empty state. The chromium-staging project already excludes it via
  // testIgnore; this skip is defense-in-depth so an explicit
  // `--project=chromium-staging-isolated` run cannot wipe shared staging data.
  test.skip(
    isStagingE2E(),
    "Destructive against shared staging data; local-only (Story 42)",
  );

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
