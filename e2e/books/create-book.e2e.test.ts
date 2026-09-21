import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { deleteBooksByTitlePrefix } from "../helpers/api";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Create Book Journey", () => {
  test.afterEach(async ({ request }) => {
    await deleteBooksByTitlePrefix(request, "E2E Book");
  });

  test("TC-H36-005: create valid book via UI", async ({ page }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);

    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/books") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    await responsePromise;

    await expect(page).toHaveURL(/\/books$/);
    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).toBeVisible();
  });

  test("TC-H36-006: created book is accessible via Details", async ({
    page,
  }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);

    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/books") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    await responsePromise;

    await page
      .getByRole("cell", { name: bookData.title, exact: true })
      .waitFor({ state: "visible" });
    await page
      .getByRole("button", { name: `View details of ${bookData.title}` })
      .click();
    await page.getByRole("heading", { name: bookData.title }).waitFor();

    await expect(
      page.getByRole("heading", { name: bookData.title }),
    ).toBeVisible();
    await expect(page.getByText(`by ${bookData.author}`)).toBeVisible();
    await expect(page.getByText(bookData.genre).first()).toBeVisible();
    await expect(page.getByText(bookData.synopsis)).toBeVisible();
  });
});
