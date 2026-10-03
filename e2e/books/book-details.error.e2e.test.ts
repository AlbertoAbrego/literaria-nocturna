import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import { expectErrorState, expectNotFoundState } from "../helpers/assertions";
import { matchBooksApi } from "../helpers/api";
import { createBookThroughUI } from "../helpers/books";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Book Details Error Scenarios", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H37-010: nonexistent book shows the not-found state", async ({
    page,
  }) => {
    const notFoundResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        matchBooksApi(new URL(response.url())),
    );

    await page.goto("/books/000000000000000000000001");

    expect((await notFoundResponse).status()).toBe(404);
    await expectNotFoundState(page);
    await expect(page).toHaveURL(/\/books\/000000000000000000000001$/);
  });

  test("TC-H37-011: invalid id format shows the error state", async ({
    page,
  }) => {
    const invalidIdResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        matchBooksApi(new URL(response.url())),
    );

    await page.goto("/books/invalid-id");

    expect((await invalidIdResponse).status()).toBe(400);
    await expectErrorState(page);
    await expect(page).toHaveURL(/\/books\/invalid-id$/);
  });

  test("TC-H37-012: books list failure shows the error state and retry recovers", async ({
    page,
  }) => {
    let failListRequests = true;
    await page.route(matchBooksApi, async (route) => {
      if (failListRequests && route.request().method() === "GET") {
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

    await gotoCatalog(page);
    await expectErrorState(page);

    failListRequests = false;
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByRole("cell").first()).toBeVisible();
  });

  test("TC-H37-013: book details failure shows the error state and retry recovers", async ({
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
  });
});
