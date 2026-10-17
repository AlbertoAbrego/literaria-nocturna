import { test, expect } from "../fixtures/test-fixtures";
import { gotoCatalog } from "../helpers/navigation";
import { matchBooksApi } from "../helpers/api";
import {
  createUniqueBookData,
  generateUniqueTitle,
} from "../fixtures/test-data";

test.describe("Catalog Journey", () => {
  let createdBookIds: string[] = [];
  // Unique per-test filter tag: parallel workers (and cross-browser
  // projects) must never see each other's books in filtered results,
  // or firstRow navigation can race another worker's afterEach cleanup
  // (Story 40).
  let filterTag = "";

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test.beforeEach(async ({ request }) => {
    filterTag = `CATALOG_TEST_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    for (let i = 0; i < 3; i++) {
      const bookData = createUniqueBookData({
        title: generateUniqueTitle(`${filterTag}_${i + 1}`),
      });
      const response = await request.post("/api/books", { data: bookData });
      const body = (await response.json()) as { _id: string };
      createdBookIds.push(body._id);
    }
  });

  test("TC-H36-001: Books List loads with test books", async ({ page }) => {
    await gotoCatalog(page);

    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Book catalog" }),
    ).toBeVisible();

    // Filter by unique prefix to isolate this test's books
    const filterResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") &&
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())),
    );
    await page.getByLabel("Title").fill(filterTag);
    await filterResponse;
    await expect(page.getByText("1 active filter")).toBeVisible();
    // Verify the filter works and returns data rows (at least header + 1 data row)
    const rowCount = await page.getByRole("row").count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test(
    "TC-H36-002: select first book and navigate to details",
    {
      tag: "@cross-browser",
    },
    async ({ page }) => {
      await gotoCatalog(page);
      const filterResponse = page.waitForResponse(
        (r) =>
          r.url().includes("/api/books") &&
          r.request().method() === "GET" &&
          matchBooksApi(new URL(r.url())),
      );
      await page.getByLabel("Title").fill(filterTag);
      await filterResponse;
      await expect(page.getByText("1 active filter")).toBeVisible();

      const firstRow = page.getByRole("row").nth(1);
      await expect(firstRow.getByRole("cell").first()).toBeVisible();
      const titleCell = firstRow.getByRole("cell").first();
      const bookTitle = await titleCell.textContent();

      // Wait for the view details button to be visible before clicking
      await expect(
        firstRow.getByRole("button", { name: /View details/i }),
      ).toBeVisible();
      await firstRow.getByRole("button", { name: /View details/i }).click();

      await expect(page).toHaveURL(/\/books\//);
      await expect(
        page.getByRole("heading", { name: bookTitle! }),
      ).toBeVisible();
    },
  );

  test("TC-H36-003: Book Details matches selected book", async ({ page }) => {
    await gotoCatalog(page);
    const filterResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") &&
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())),
    );
    await page.getByLabel("Title").fill(filterTag);
    await filterResponse;
    await expect(page.getByText("1 active filter")).toBeVisible();

    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toBeVisible();
    const bookTitle = await firstRow.getByRole("cell").first().textContent();
    const bookAuthor = await firstRow.getByRole("cell").nth(1).textContent();
    const bookGenre = await firstRow.getByRole("cell").nth(2).textContent();

    // Wait for the view details button to be visible before clicking
    await expect(
      firstRow.getByRole("button", { name: /View details/i }),
    ).toBeVisible();
    await firstRow.getByRole("button", { name: /View details/i }).click();
    await page.getByRole("heading", { name: bookTitle! }).waitFor();

    await expect(page.getByRole("heading", { name: bookTitle! })).toBeVisible();
    await expect(page.getByText(`by ${bookAuthor}`)).toBeVisible();
    await expect(page.getByText(bookGenre!).first()).toBeVisible();
    await expect(page.getByText(/.+/).first()).toBeVisible();
  });

  test("TC-H36-004: return to Books List from Book Details", async ({
    page,
  }) => {
    await gotoCatalog(page);
    const filterResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") &&
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())),
    );
    await page.getByLabel("Title").fill(filterTag);
    await filterResponse;
    await expect(page.getByText("1 active filter")).toBeVisible();

    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow.getByRole("cell").first()).toBeVisible();
    const bookTitle = await firstRow.getByRole("cell").first().textContent();

    // Wait for the view details button to be visible before clicking
    await expect(
      firstRow.getByRole("button", { name: /View details/i }),
    ).toBeVisible();
    await firstRow.getByRole("button", { name: /View details/i }).click();
    await page.getByRole("heading", { name: bookTitle! }).waitFor();

    await page.getByRole("link", { name: "Back to catalog" }).click();

    await expect(page).toHaveURL(/\/books$/);
    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Book catalog" }),
    ).toBeVisible();
  });
});
