import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import {
  expectRequestMatches,
  expectSuccessResponse,
  matchBooksApi,
} from "../helpers/api";
import { createUniqueBookData } from "../fixtures/test-data";

// Story 39 - Scenario 2: create book through the real UI.
// Validates the POST /api/books contract: outgoing payload (exact field set
// with expected values) and the 201 book-shaped response consumed by the app.
// Goes beyond create-book.e2e.test.ts, which verifies the create journey's
// behavior but not the request and response contract.

test.describe("API/UI Contract Validation", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H39-002: create request and response keep the book contract", async ({
    page,
  }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);

    await page.getByLabel("Title").fill(bookData.title);
    await page.getByLabel("Author").fill(bookData.author);
    await page.getByLabel("Genre").selectOption(bookData.genre);
    await page.getByLabel("Synopsis").fill(bookData.synopsis);

    const postResponsePromise = page.waitForResponse(
      (r) => r.request().method() === "POST" && matchBooksApi(new URL(r.url())),
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const postResponse = await postResponsePromise;

    await expectRequestMatches(postResponse, {
      method: "POST",
      pathname: "/api/books",
      bodyShape: {
        title: bookData.title,
        author: bookData.author,
        genre: bookData.genre,
        synopsis: bookData.synopsis,
      },
    });
    const requestBody = postResponse.request().postDataJSON() as Record<
      string,
      unknown
    >;
    expect(Object.keys(requestBody).sort()).toEqual([
      "author",
      "genre",
      "synopsis",
      "title",
    ]);

    const book = await expectSuccessResponse(postResponse, "book");
    createdBookIds.push(book._id);
    expect(book._id).toBeTruthy();
    expect(book.title).toBe(bookData.title);

    await expect(page).toHaveURL(/\/books$/);
    await page.getByLabel("Title").fill(bookData.title);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: bookData.title, exact: true }),
    ).toBeVisible();
  });
});
