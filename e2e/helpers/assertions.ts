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

export async function expectFieldError(
  page: Page,
  message: string,
): Promise<void> {
  await expect(page.getByText(message)).toBeVisible();
}

export async function expectFormErrorAlert(
  page: Page,
  message: string,
): Promise<void> {
  await expect(page.getByRole("alert")).toHaveText(message);
}

export async function expectErrorState(page: Page): Promise<void> {
  await expect(
    page.getByText("The archive could not be reached."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
}

export async function expectNotFoundState(page: Page): Promise<void> {
  await expect(
    page.getByText("This volume does not exist in the catalog."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /back to (the )?catalog/i }),
  ).toBeVisible();
}
