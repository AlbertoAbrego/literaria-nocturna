import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Create Book Journey", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H36-005: create valid book via UI", async ({ page }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);

    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const postResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const response = await postResponse;
    const body = (await response.json()) as { _id: string };
    createdBookIds.push(body._id);
    await page.waitForLoadState("networkidle");

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

    const postResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const response = await postResponse;
    const body = (await response.json()) as { _id: string };
    createdBookIds.push(body._id);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `View details of ${bookData.title}` })
      .click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: bookData.title }),
    ).toBeVisible();
    await expect(page.getByText(`by ${bookData.author}`)).toBeVisible();
    await expect(page.getByText(bookData.genre).first()).toBeVisible();
    await expect(page.getByText(bookData.synopsis)).toBeVisible();
  });
});
