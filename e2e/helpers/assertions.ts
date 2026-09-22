import { expect, type Page } from "@playwright/test";

export async function expectBookInCatalog(
  page: Page,
  title: string,
): Promise<void> {
  await expect(page.getByRole("cell", { name: title })).toBeVisible();
}

export async function expectBookDetails(
  page: Page,
  details: { title: string; author: string; genre: string; synopsis: string },
): Promise<void> {
  await expect(
    page.getByRole("heading", { name: details.title }),
  ).toBeVisible();
  await expect(page.getByText(`by ${details.author}`)).toBeVisible();
  await expect(page.getByText(details.genre).first()).toBeVisible();
  await expect(page.getByText(details.synopsis)).toBeVisible();
}

export async function expectDeleted(page: Page, title: string): Promise<void> {
  await expect(page.getByRole("cell", { name: title })).not.toBeVisible();
}
