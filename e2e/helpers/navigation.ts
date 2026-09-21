import type { Page } from "@playwright/test";

export async function gotoCatalog(page: Page): Promise<void> {
  await page.goto("/books");
  await page.getByRole("heading", { name: "Catalog" }).waitFor();
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
