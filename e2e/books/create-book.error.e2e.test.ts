import { test, expect } from "@playwright/test";
import { gotoCatalog, gotoCreateBook } from "../helpers/navigation";
import { expectFieldError, expectFormErrorAlert } from "../helpers/assertions";
import { matchBooksApi } from "../helpers/api";
import { createBookThroughUI } from "../helpers/books";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Create Book Validation Errors", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H37-001: submitting an empty form shows all required-field errors", async ({
    page,
  }) => {
    await gotoCreateBook(page);

    await page.getByRole("button", { name: /catalog the book/i }).click();

    await expectFieldError(page, "Title is required.");
    await expectFieldError(page, "Author is required.");
    await expectFieldError(page, "Select a genre.");
    await expectFieldError(page, "Synopsis is required.");
    await expect(page).toHaveURL(/\/books\/create$/);
    await expect(page.getByRole("alert")).not.toBeVisible();
  });

  test("TC-H37-002: missing title shows only the title error", async ({
    page,
  }) => {
    await gotoCreateBook(page);

    await page.getByLabel("Author").fill("Ada Lovelace");
    await page.getByLabel("Genre").selectOption("Thriller");
    await page
      .getByLabel("Synopsis")
      .fill("A synopsis used by the E2E validation suite.");

    await page.getByRole("button", { name: /catalog the book/i }).click();

    await expectFieldError(page, "Title is required.");
    await expect(page.getByText("Author is required.")).not.toBeVisible();
    await expect(page.getByText("Select a genre.")).not.toBeVisible();
    await expect(page.getByText("Synopsis is required.")).not.toBeVisible();
    await expect(page).toHaveURL(/\/books\/create$/);
  });

  test("TC-H37-004: server validation error renders under the field", async ({
    page,
  }) => {
    await gotoCreateBook(page);

    await page.route(matchBooksApi, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: { title: "title is required" },
          }),
        });
        return;
      }
      await route.continue();
    });

    const book = createUniqueBookData();
    await page.getByLabel("Title").fill(book.title);
    await page.getByLabel("Author").fill(book.author);
    await page.getByLabel("Genre").selectOption(book.genre);
    await page.getByLabel("Synopsis").fill(book.synopsis);

    await page.getByRole("button", { name: /catalog the book/i }).click();

    await expectFieldError(page, "title is required");
    await expect(page.getByLabel("Title")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page.getByRole("alert")).not.toBeVisible();
    await expect(page).toHaveURL(/\/books\/create$/);
    await expect(page.getByLabel("Title")).toHaveValue(book.title);
  });

  test("TC-H37-005: duplicate book shows a conflict and is not created", async ({
    page,
  }) => {
    const book = createUniqueBookData();

    createdBookIds.push(await createBookThroughUI(page, book));

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(book.title);
    await page.getByLabel("Author").fill(book.author);
    await page.getByLabel("Genre").selectOption(book.genre);
    await page.getByLabel("Synopsis").fill(book.synopsis);

    await page.getByRole("button", { name: /catalog the book/i }).click();

    await expectFormErrorAlert(page, "Book already exists.");
    await expect(page).toHaveURL(/\/books\/create$/);
    await expect(page.getByLabel("Title")).toHaveValue(book.title);

    await gotoCatalog(page);
    await page.getByLabel("Title").fill(book.title);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: book.title, exact: true }),
    ).toHaveCount(1);
  });
});
