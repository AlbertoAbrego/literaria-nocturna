import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import { expectBookDetails } from "../helpers/assertions";
import {
  expectRequestMatches,
  expectSuccessResponse,
  matchBooksApi,
} from "../helpers/api";
import { createUniqueBookData } from "../fixtures/test-data";
import type { UniqueBookData } from "../fixtures/test-data";

// Story 39 - Scenario 3: fetch book details through the real UI.
// Validates the GET /api/books/:id contract: the id path param the frontend
// builds (AC4) and the book-shaped response the details page consumes. Goes
// beyond create-book.e2e.test.ts TC-H36-006, which verifies the journey's
// behavior but not the request and response contract.

test.describe("API/UI Contract Validation", () => {
  let createdBookId: string | null = null;
  let bookData!: UniqueBookData;

  test.beforeEach(async ({ request }) => {
    bookData = createUniqueBookData();
    const response = await request.post("/api/books", { data: bookData });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { _id: string };
    createdBookId = body._id;
  });

  test.afterEach(async ({ request }) => {
    if (createdBookId) {
      await request.delete(`/api/books/${createdBookId}`);
      createdBookId = null;
    }
  });

  test("TC-H39-003: details fetch keeps the by-id path contract", async ({
    page,
  }) => {
    await gotoCatalog(page);

    const listResponsePromise = page.waitForResponse(
      (r) => r.request().method() === "GET" && matchBooksApi(new URL(r.url())),
    );
    await page.getByLabel("Title").fill(bookData.title);
    await listResponsePromise;
    await expect(page.getByText("1 active filter")).toBeVisible();

    const detailsResponsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname === `/api/books/${createdBookId}`,
    );
    await page
      .getByRole("button", { name: `View details of ${bookData.title}` })
      .click();
    const detailsResponse = await detailsResponsePromise;

    await expectRequestMatches(detailsResponse, {
      method: "GET",
      pathname: `/api/books/${createdBookId}`,
    });
    const book = await expectSuccessResponse(detailsResponse, "book");
    expect(book._id).toBe(createdBookId);
    expect(book.title).toBe(bookData.title);

    await expectBookDetails(page, bookData);
  });
});
