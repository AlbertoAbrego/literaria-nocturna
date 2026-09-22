import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";

test.describe("Catalog Journey", () => {
  test("TC-H36-001: Books List loads with seeded books", async ({ page }) => {
    await gotoCatalog(page);

    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Book catalog" }),
    ).toBeVisible();

    await expect(page.getByRole("row")).toHaveCount(11);
  });

  test("TC-H36-002: select first book and navigate to details", async ({
    page,
  }) => {
    await gotoCatalog(page);

    const firstRow = page.getByRole("row").nth(1);
    const titleCell = firstRow.getByRole("cell").first();
    const bookTitle = await titleCell.textContent();

    await firstRow.getByRole("button", { name: /View details/i }).click();

    await expect(page).toHaveURL(/\/books\//);
    await expect(page.getByRole("heading", { name: bookTitle! })).toBeVisible();
  });

  test("TC-H36-003: Book Details matches selected book", async ({ page }) => {
    await gotoCatalog(page);

    const firstRow = page.getByRole("row").nth(1);
    const bookTitle = await firstRow.getByRole("cell").first().textContent();
    const bookAuthor = await firstRow.getByRole("cell").nth(1).textContent();
    const bookGenre = await firstRow.getByRole("cell").nth(2).textContent();

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

    const firstRow = page.getByRole("row").nth(1);
    const bookTitle = await firstRow.getByRole("cell").first().textContent();
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
