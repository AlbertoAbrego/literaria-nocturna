import { expect, type Page } from "@playwright/test";
import { matchBooksApi } from "./api";
import { gotoCreateBook } from "./navigation";
import type { UniqueBookData } from "../fixtures/test-data";

// Creates a book through the real Create Book form and returns the id
// reported by the app's own API. Waits for the success redirect to the
// catalog so callers can navigate immediately afterwards.
export async function createBookThroughUI(
  page: Page,
  data: UniqueBookData,
): Promise<string> {
  await gotoCreateBook(page);
  await page.getByLabel("Title").fill(data.title);
  await page.getByLabel("Author").fill(data.author);
  await page.getByLabel("Genre").selectOption(data.genre);
  await page.getByLabel("Synopsis").fill(data.synopsis);

  const postResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      matchBooksApi(new URL(response.url())),
  );
  await page.getByRole("button", { name: /catalog the book/i }).click();
  const response = await postResponse;
  const body = (await response.json()) as { _id: string };

  await expect(page).toHaveURL(/\/books$/);
  return body._id;
}
