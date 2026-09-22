import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Delete Book Journey", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H36-009: delete via trash icon and confirmation modal", async ({
    page,
  }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const createResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const createRes = await createResponse;
    const createBody = (await createRes.json()) as { _id: string };
    createdBookIds.push(createBody._id);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `Delete ${bookData.title}` })
      .click();

    const modalTitle = `Delete "${bookData.title}"?`;
    await expect(page.getByRole("dialog", { name: modalTitle })).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") && r.request().method() === "DELETE",
    );
    await page
      .getByRole("dialog", { name: modalTitle })
      .getByRole("button", { name: "Delete" })
      .click();
    await deleteResponse;

    await expect(
      page.getByRole("dialog", { name: modalTitle }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).not.toBeVisible();

    createdBookIds = [];
  });

  test("TC-H36-010: deleted book shows not found on Details", async ({
    page,
  }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const createResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const createRes = await createResponse;
    const createBody = (await createRes.json()) as { _id: string };
    const bookId = createBody._id;
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `Delete ${bookData.title}` })
      .click();

    const modalTitle = `Delete "${bookData.title}"?`;
    await expect(page.getByRole("dialog", { name: modalTitle })).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") && r.request().method() === "DELETE",
    );
    await page
      .getByRole("dialog", { name: modalTitle })
      .getByRole("button", { name: "Delete" })
      .click();
    await deleteResponse;

    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).not.toBeVisible();

    await page.goto(`/books/${bookId}`);
    await expect(
      page.getByText("This volume does not exist in the catalog."),
    ).toBeVisible();

    createdBookIds = [];
  });
});
