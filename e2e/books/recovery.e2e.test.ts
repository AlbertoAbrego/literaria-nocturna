import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import {
  expectErrorState,
  expectFieldError,
  expectFormErrorAlert,
  expectNotFoundState,
} from "../helpers/assertions";
import { matchBooksApi } from "../helpers/api";
import { createBookThroughUI } from "../helpers/books";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Error Recovery Flows", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H37-017: correcting validation errors and resubmitting creates the book", async ({
    page,
  }) => {
    const book = createUniqueBookData();

    await gotoCreateBook(page);
    await page.getByRole("button", { name: /catalog the book/i }).click();
    await expectFieldError(page, "Title is required.");

    await page.getByLabel("Title").fill(book.title);
    await page.getByLabel("Author").fill(book.author);
    await page.getByLabel("Genre").selectOption(book.genre);
    await page.getByLabel("Synopsis").fill(book.synopsis);
    await expect(page.getByText("Title is required.")).not.toBeVisible();

    const postResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        matchBooksApi(new URL(response.url())),
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const body = (await (await postResponse).json()) as { _id: string };
    createdBookIds.push(body._id);

    await expect(page).toHaveURL(/\/books$/);
    await page.getByLabel("Title").fill(book.title);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: book.title, exact: true }),
    ).toHaveCount(1);
  });

  test("TC-H37-018: resubmitting after a create server error creates the book", async ({
    page,
  }) => {
    const book = createUniqueBookData();

    await gotoCreateBook(page);

    let failCreateRequests = true;
    await page.route(matchBooksApi, async (route) => {
      if (failCreateRequests && route.request().method() === "POST") {
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

    await page.getByLabel("Title").fill(book.title);
    await page.getByLabel("Author").fill(book.author);
    await page.getByLabel("Genre").selectOption(book.genre);
    await page.getByLabel("Synopsis").fill(book.synopsis);

    await page.getByRole("button", { name: /catalog the book/i }).click();
    await expectFormErrorAlert(page, "Internal Server Error");
    await expect(page).toHaveURL(/\/books\/create$/);
    await expect(page.getByLabel("Title")).toHaveValue(book.title);

    failCreateRequests = false;
    const postResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        matchBooksApi(new URL(response.url())),
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    await expect(page.getByRole("alert")).not.toBeVisible();
    const body = (await (await postResponse).json()) as { _id: string };
    createdBookIds.push(body._id);

    await expect(page).toHaveURL(/\/books$/);
    await page.getByLabel("Title").fill(book.title);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: book.title, exact: true }),
    ).toHaveCount(1);
  });

  test("TC-H37-019: retrying book details after a server error loads the book", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    const id = await createBookThroughUI(page, book);
    createdBookIds.push(id);

    let failDetailRequests = true;
    await page.route(matchBooksApi, async (route) => {
      if (failDetailRequests && route.request().method() === "GET") {
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

    await page.goto(`/books/${id}`);
    await expectErrorState(page);

    failDetailRequests = false;
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByRole("heading", { name: book.title })).toBeVisible();
    await expect(page.getByText(`by ${book.author}`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /edit this volume/i }),
    ).toBeVisible();
  });

  test("TC-H37-020: navigating back from the not-found state returns to a working catalog", async ({
    page,
  }) => {
    await page.goto("/books/000000000000000000000001");
    await expectNotFoundState(page);

    await page.getByRole("link", { name: /back to (the )?catalog/i }).click();

    await expect(page).toHaveURL(/\/books$/);
    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    await expect(page.getByText("Showing")).toBeVisible();
  });
});
