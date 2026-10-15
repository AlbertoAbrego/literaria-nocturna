import type { Page } from "@playwright/test";
import { matchBooksApi } from "./api";

export async function gotoCatalog(page: Page): Promise<void> {
  const getResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      matchBooksApi(new URL(response.url())),
  );
  await page.goto("/books");
  await page.getByRole("heading", { name: "Catalog" }).waitFor();
  // An empty catalog renders EmptyState instead of the table; wait for
  // either settled state so a fast response cannot race the wait.
  await page
    .getByRole("table", { name: "Book catalog" })
    .or(page.getByTestId("empty-state"))
    .waitFor();
  await getResponse;
}

export async function gotoCreateBook(page: Page): Promise<void> {
  await page.goto("/books/create");
  await page.getByRole("heading", { name: "Add a New Volume" }).waitFor();
}

export async function gotoBookDetails(
  page: Page,
  title: string,
): Promise<void> {
  await gotoCatalog(page);
  await page.getByRole("button", { name: `View details of ${title}` }).click();
  await page.getByRole("heading", { name: title }).waitFor();
}

export async function gotoEditBook(page: Page, title: string): Promise<void> {
  await gotoBookDetails(page, title);
  await page.getByRole("link", { name: "Edit this volume" }).click();
  await page.getByRole("heading", { name: "Edit Volume" }).waitFor();
}
