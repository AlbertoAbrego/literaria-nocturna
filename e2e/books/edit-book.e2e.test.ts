import { test, expect } from "@playwright/test";
import { gotoCreateBook } from "../helpers/navigation";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Edit Book Journey", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H36-007: edit controlled book via UI", async ({ page }) => {
    const original = createUniqueBookData();
    const updatedTitle = `${original.title} Updated`;

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(original.title);
    await page.getByLabel("Author").fill(original.author);
    await page.getByLabel("Genre").selectOption(original.genre);
    await page.getByLabel("Synopsis").fill(original.synopsis);

    const createResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const createRes = await createResponse;
    const createBody = (await createRes.json()) as { _id: string };
    createdBookIds.push(createBody._id);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("cell", { name: original.title, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `View details of ${original.title}` })
      .click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: original.title }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Edit this volume" }).click();
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Title").fill(updatedTitle);

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: /update the book/i }).click();
    await updateResponse;
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(page.getByText(`by ${original.author}`)).toBeVisible();
  });

  test("TC-H36-008: updated book reflects in Catalog", async ({ page }) => {
    const original = createUniqueBookData();
    const updatedTitle = `${original.title} Updated`;

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(original.title);
    await page.getByLabel("Author").fill(original.author);
    await page.getByLabel("Genre").selectOption(original.genre);
    await page.getByLabel("Synopsis").fill(original.synopsis);

    const createResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const createRes = await createResponse;
    const createBody = (await createRes.json()) as { _id: string };
    createdBookIds.push(createBody._id);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("cell", { name: original.title, exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: `View details of ${original.title}` })
      .click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: original.title }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Edit this volume" }).click();
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Title").fill(updatedTitle);

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "PATCH",
    );
    await page.getByRole("button", { name: /update the book/i }).click();
    await updateResponse;

    await expect(page.getByRole("heading", { name: updatedTitle })).toBeVisible(
      { timeout: 10_000 },
    );

    await page.getByRole("link", { name: "Back to catalog" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/books$/);
    await expect(
      page.getByRole("cell", { name: updatedTitle, exact: true }),
    ).toBeVisible();
  });
});
