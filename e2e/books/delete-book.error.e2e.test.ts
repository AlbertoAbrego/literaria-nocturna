import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import { matchBooksApi } from "../helpers/api";
import { createBookThroughUI } from "../helpers/books";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Delete Book Error Scenarios", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H37-016: delete failure leaves the book in the catalog without a false success", async ({
    page,
  }) => {
    const book = createUniqueBookData();
    createdBookIds.push(await createBookThroughUI(page, book));

    await gotoCatalog(page);
    await page.getByLabel("Title").fill(book.title);
    // Wait for the debounced filter commit before touching the row: asserting
    // the cell too early can pass against the unfiltered query, and the late
    // key switch replaces the table with a skeleton, unmounting the dialog.
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: book.title, exact: true }),
    ).toBeVisible();

    await page.route(matchBooksApi, async (route) => {
      if (route.request().method() === "DELETE") {
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

    await page.getByRole("button", { name: `Delete ${book.title}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: `Delete "${book.title}"?` }),
    ).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        matchBooksApi(new URL(response.url())),
    );
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    expect((await deleteResponse).status()).toBe(500);

    // The delete removes the row optimistically before the request resolves, so
    // the failure rolls the list back instead of keeping the confirmation (and
    // its error alert) mounted. What must hold either way: the failure is never
    // reported as a success - the book is still in the catalog.
    await expect(
      page.getByRole("cell", { name: book.title, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();
  });
});
