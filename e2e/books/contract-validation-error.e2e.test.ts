import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { expectFieldError } from "../helpers/assertions";
import {
  expectErrorResponse,
  expectRequestMatches,
  matchBooksApi,
} from "../helpers/api";
import { createUniqueBookData } from "../fixtures/test-data";

// Story 39 - Scenario 4: real backend 400 validation error through the UI.
// The create form's client-side validation never submits an invalid genre, so
// the request body is mutated at the network boundary (page.route) to exercise
// the REAL backend validation contract, distinct from
// create-book.error.e2e.test.ts, which renders MSW-mocked error responses.
// Verifies the outgoing mutated request, the 400 VALIDATION_ERROR shape with
// field details, and the field-level error display in the live UI.

test.describe("API/UI Contract Validation", () => {
  test("TC-H39-004: invalid genre keeps the validation error contract", async ({
    page,
  }) => {
    const bookData = createUniqueBookData();

    await gotoCreateBook(page);

    await page.route(
      (url) => matchBooksApi(url),
      async (route) => {
        const request = route.request();
        if (request.method() !== "POST") {
          await route.continue();
          return;
        }
        const original = request.postDataJSON() as Record<string, unknown>;
        const mutated = { ...original, genre: "Mystery" };
        await route.continue({ postData: JSON.stringify(mutated) });
      },
    );

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
      bodyShape: { title: bookData.title, genre: "Mystery" },
    });

    const errorBody = await expectErrorResponse(
      postResponse,
      400,
      "VALIDATION_ERROR",
    );
    expect(errorBody.message).toBe("Validation failed");
    expect(errorBody.details).toMatchObject({ genre: "Invalid genre" });

    await expectFieldError(page, "Invalid genre");
    await expect(page).toHaveURL(/\/books\/create/);
    await expect(page.getByLabel("Title")).toHaveValue(bookData.title);
    await expect(page.getByLabel("Genre")).toHaveValue(bookData.genre);
    await expect(page.getByRole("alert")).not.toBeVisible();
  });
});
