import { test, expect } from "../fixtures/test-fixtures";
import { gotoCreateBook } from "../helpers/navigation";
import { matchBooksApi } from "../helpers/api";
import { createUniqueBookData } from "../fixtures/test-data";

test.describe("Edit Book Journey", () => {
  let createdBookIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test(
    "TC-H36-007: edit controlled book via UI",
    {
      tag: "@cross-browser",
    },
    async ({ page }) => {
      const original = createUniqueBookData();
      const updatedTitle = `${original.title} Updated`;

      await gotoCreateBook(page);
      await page.getByLabel("Title").fill(original.title);
      await page.getByLabel("Author").fill(original.author);
      await page.getByLabel("Genre").selectOption(original.genre);
      await page.getByLabel("Synopsis").fill(original.synopsis);

      // Register both listeners before submitting: the catalog GET fires
      // during the post-create redirect and can complete before a listener
      // registered after toHaveURL, hanging the await (Story 40).
      const createResponse = page.waitForResponse(
        (r) =>
          r.url().includes("/api/books") && r.request().method() === "POST",
      );
      const getResponse = page.waitForResponse(
        (r) =>
          r.url().includes("/api/books") &&
          r.request().method() === "GET" &&
          matchBooksApi(new URL(r.url())),
      );
      await page.getByRole("button", { name: /catalog the book/i }).click();
      const createRes = await createResponse;
      const createBody = (await createRes.json()) as { _id: string };
      createdBookIds.push(createBody._id);

      await expect(page).toHaveURL(/\/books$/);
      await getResponse;

      await page.getByLabel("Title").fill(original.title);
      await expect(page.getByText("1 active filter")).toBeVisible();
      await expect(
        page.getByRole("cell", { name: original.title, exact: true }),
      ).toBeVisible();

      const detailResponse = page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          new URL(r.url()).pathname === `/api/books/${createBody._id}`,
      );
      await page
        .getByRole("button", { name: `View details of ${original.title}` })
        .click();
      await detailResponse;
      await expect(
        page.getByRole("heading", { name: original.title }),
      ).toBeVisible();

      await page.getByRole("link", { name: "Edit this volume" }).click();
      // staleTime (60s) keeps the cached detail fresh, so no GET fires here;
      // wait for the route transition instead (Story 43).
      await expect(
        page.getByRole("heading", { name: "Edit Volume" }),
      ).toBeVisible();

      await page.getByLabel("Title").fill(updatedTitle);

      const updateResponse = page.waitForResponse(
        (r) =>
          r.url().includes("/api/books") && r.request().method() === "PATCH",
      );
      // Invalidation forces a by-id refetch after the update; register before
      // submitting so the listener cannot miss it (Story 40 pattern).
      const refetchResponse = page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          new URL(r.url()).pathname === `/api/books/${createBody._id}`,
      );
      await page.getByRole("button", { name: /update the book/i }).click();
      await updateResponse;
      await refetchResponse;

      await expect(
        page.getByRole("heading", { name: updatedTitle }),
      ).toBeVisible();
      await expect(page.getByText(`by ${original.author}`)).toBeVisible();
    },
  );

  test("TC-H36-008: updated book reflects in Catalog", async ({ page }) => {
    const original = createUniqueBookData();
    const updatedTitle = `${original.title} Updated`;

    await gotoCreateBook(page);
    await page.getByLabel("Title").fill(original.title);
    await page.getByLabel("Author").fill(original.author);
    await page.getByLabel("Genre").selectOption(original.genre);
    await page.getByLabel("Synopsis").fill(original.synopsis);

    // Register both listeners before submitting: the catalog GET fires
    // during the post-create redirect and can complete before a listener
    // registered after toHaveURL, hanging the await (Story 40).
    const createResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "POST",
    );
    const getResponse1 = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") &&
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())),
    );
    await page.getByRole("button", { name: /catalog the book/i }).click();
    const createRes = await createResponse;
    const createBody = (await createRes.json()) as { _id: string };
    createdBookIds.push(createBody._id);

    await expect(page).toHaveURL(/\/books$/);
    await getResponse1;

    await page.getByLabel("Title").fill(original.title);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: original.title, exact: true }),
    ).toBeVisible();

    const detailResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname === `/api/books/${createBody._id}`,
    );
    await page
      .getByRole("button", { name: `View details of ${original.title}` })
      .click();
    await detailResponse;
    await expect(
      page.getByRole("heading", { name: original.title }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Edit this volume" }).click();
    // staleTime (60s) keeps the cached detail fresh, so no GET fires here;
    // wait for the route transition instead (Story 43).
    await expect(
      page.getByRole("heading", { name: "Edit Volume" }),
    ).toBeVisible();

    await page.getByLabel("Title").fill(updatedTitle);

    const updateResponse = page.waitForResponse(
      (r) => r.url().includes("/api/books") && r.request().method() === "PATCH",
    );
    // Invalidation forces a by-id refetch after the update; register before
    // submitting so the listener cannot miss it (Story 40 pattern).
    const refetchResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        new URL(r.url()).pathname === `/api/books/${createBody._id}`,
    );
    await page.getByRole("button", { name: /update the book/i }).click();
    await updateResponse;
    await refetchResponse;

    await expect(
      page.getByRole("heading", { name: updatedTitle }),
    ).toBeVisible();

    // Register before navigating back: the catalog GET can complete before
    // a listener registered after navigation, hanging the await (Story 40).
    const getResponse2 = page.waitForResponse(
      (r) =>
        r.url().includes("/api/books") &&
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())),
    );
    await page.getByRole("link", { name: "Back to catalog" }).click();

    await expect(page).toHaveURL(/\/books$/);
    await getResponse2;

    await page.getByLabel("Title").fill(updatedTitle);
    await expect(page.getByText("1 active filter")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: updatedTitle, exact: true }),
    ).toBeVisible();
  });
});
