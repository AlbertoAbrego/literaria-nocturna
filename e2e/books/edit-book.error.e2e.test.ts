import { test, expect, type Page } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { expectFieldError, expectFormErrorAlert } from "../helpers/assertions";
import { matchBooksApi } from "../helpers/api";
import { createBookThroughUI } from "../helpers/books";
import {
  createUniqueBookData,
  type UniqueBookData,
} from "../fixtures/test-data";

// Setup navigation uses the id reported by the app's own API right after
// creating the book (same approach as Story 36): the edit form itself is the
// journey under test, and this avoids depending on which page of the catalog
// the new book lands on.
async function createAndOpenEditForm(
  page: Page,
  data: UniqueBookData,
): Promise<string> {
  const id = await createBookThroughUI(page, data);
  await page.goto(`/books/${id}/edit`);
  await page.getByRole("heading", { name: "Edit Volume" }).waitFor();
  return id;
}

test.describe("Edit Book Validation Errors", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H37-006: clearing the title shows the required error", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    const id = await createAndOpenEditForm(page, book);
    createdBookIds.push(id);

    await page.getByLabel("Title").fill("");
    await page.getByRole("button", { name: /update the book/i }).click();

    await expectFieldError(page, "Title is required.");
    await expect(page.getByText("Author is required.")).not.toBeVisible();
    await expect(page).toHaveURL(`/books/${id}/edit`);
  });

  test("TC-H37-007: clearing the genre shows the selection error", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    const id = await createAndOpenEditForm(page, book);
    createdBookIds.push(id);

    await page.getByLabel("Genre").selectOption("");
    await page.getByRole("button", { name: /update the book/i }).click();

    await expectFieldError(page, "Select a genre.");
    await expect(page.getByText("Title is required.")).not.toBeVisible();
    await expect(page).toHaveURL(`/books/${id}/edit`);
  });

  test("TC-H37-008: server validation error renders under the field and preserves the book", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    const id = await createAndOpenEditForm(page, book);
    createdBookIds.push(id);

    await page.route(matchBooksApi, async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: { author: "author is required" },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByLabel("Title").fill(`${book.title} Updated`);
    await page.getByRole("button", { name: /update the book/i }).click();

    await expectFieldError(page, "author is required");
    await expect(page.getByLabel("Author")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByRole("alert")).not.toBeVisible();
    await expect(page).toHaveURL(`/books/${id}/edit`);
    await expect(page.getByLabel("Title")).toHaveValue(`${book.title} Updated`);

    await page.goto(`/books/${id}`);
    await expect(
      page.getByRole("heading", { name: book.title, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(`by ${book.author}`)).toBeVisible();
  });

  test("TC-H37-009: duplicate conflict on edit keeps the original book", async ({
    page,
  }) => {
    const originalA = createUniqueBookData({ author: "Primary Author" });
    const originalB = createUniqueBookData({ author: "Secondary Author" });

    const idA = await createBookThroughUI(page, originalA);
    const idB = await createBookThroughUI(page, originalB);
    createdBookIds.push(idA, idB);

    await page.goto(`/books/${idB}/edit`);
    await page.getByRole("heading", { name: "Edit Volume" }).waitFor();

    await page.getByLabel("Title").fill(originalA.title);
    await page.getByLabel("Author").fill(originalA.author);
    await page.getByRole("button", { name: /update the book/i }).click();

    await expectFormErrorAlert(page, "Book already exists.");
    await expect(page).toHaveURL(`/books/${idB}/edit`);
    await expect(page.getByLabel("Title")).toHaveValue(originalA.title);
    await expect(page.getByLabel("Author")).toHaveValue(originalA.author);

    await page.goto(`/books/${idB}`);
    await expect(
      page.getByRole("heading", { name: originalB.title, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(`by ${originalB.author}`)).toBeVisible();
  });

  test("TC-H37-015: server failure shows an error and preserves the form data", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    const id = await createAndOpenEditForm(page, book);
    createdBookIds.push(id);

    await page.route(matchBooksApi, async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Internal Server Error",
            code: "INTERNAL_ERROR",
          }),
        });
        return;
      }
      await route.continue();
    });

    const updatedTitle = `${book.title} Updated`;
    await page.getByLabel("Title").fill(updatedTitle);
    await page.getByRole("button", { name: /update the book/i }).click();

    await expectFormErrorAlert(page, "Internal Server Error");
    await expect(page).toHaveURL(`/books/${id}/edit`);
    await expect(page.getByLabel("Title")).toHaveValue(updatedTitle);
    await expect(page.getByLabel("Author")).toHaveValue(book.author);
  });
});
