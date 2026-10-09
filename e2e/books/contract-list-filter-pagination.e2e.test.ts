import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import {
  expectRequestMatches,
  expectSuccessResponse,
  matchBooksApi,
} from "../helpers/api";
import { generateUniqueTitle, getE2ERunId } from "../fixtures/test-data";

// Story 39 - Scenario 1: list with combined filters + pagination.
// Validates the outgoing query contract (title, genre, page), the pagination
// metadata consumed by the UI (page, limit, total, totalPages) and the rendered
// "Showing X-Y of Z volumes" result against the real backend. Goes beyond
// catalog.e2e.test.ts, which verifies filter behavior but not the request and
// response contract. The run-scoped title token isolates the exact counts from
// books left behind by crashed runs.

const SEED_COUNT = 12;
const TITLE_TOKEN = "PAGED_TEST";

test.describe("API/UI Contract Validation", () => {
  let createdBookIds: string[] = [];
  let titleFilter = "";

  test.beforeEach(async ({ request }) => {
    titleFilter = `E2E:${getE2ERunId()}:${TITLE_TOKEN}`;

    for (let i = 0; i < SEED_COUNT; i++) {
      const response = await request.post("/api/books", {
        data: {
          title: generateUniqueTitle(`${TITLE_TOKEN}_${i + 1}`),
          author: "Contract Pagination Author",
          genre: "Horror",
          synopsis: "Seeded book for pagination contract validation.",
        },
      });
      expect(response.ok()).toBeTruthy();
      const body = (await response.json()) as { _id: string };
      createdBookIds.push(body._id);
    }
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test("TC-H39-001: combined filters and pagination keep the query contract", async ({
    page,
  }) => {
    await gotoCatalog(page);

    const filteredResponsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())) &&
        new URL(r.url()).searchParams.get("title") === titleFilter &&
        new URL(r.url()).searchParams.get("genre") === "Horror",
    );
    await page.getByLabel("Title").fill(titleFilter);
    await page.getByLabel("Genre").selectOption("Horror");
    const filteredResponse = await filteredResponsePromise;

    await expectRequestMatches(filteredResponse, {
      method: "GET",
      pathname: "/api/books",
      queryParams: { title: titleFilter, genre: "Horror" },
    });
    const firstPage = await expectSuccessResponse(
      filteredResponse,
      "paginated",
    );
    expect(firstPage.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: SEED_COUNT,
      totalPages: 2,
    });
    expect(firstPage.data).toHaveLength(10);
    await expect(page.getByText("Showing 1–10 of 12 volumes")).toBeVisible();
    await expect(page.getByText("2 active filters")).toBeVisible();

    const pageTwoResponsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        matchBooksApi(new URL(r.url())) &&
        new URL(r.url()).searchParams.get("page") === "2",
    );
    await page.getByRole("button", { name: "Next" }).click();
    const pageTwoResponse = await pageTwoResponsePromise;

    await expectRequestMatches(pageTwoResponse, {
      method: "GET",
      pathname: "/api/books",
      queryParams: { title: titleFilter, genre: "Horror", page: "2" },
    });
    const secondPage = await expectSuccessResponse(
      pageTwoResponse,
      "paginated",
    );
    expect(secondPage.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: SEED_COUNT,
      totalPages: 2,
    });
    expect(secondPage.data).toHaveLength(2);

    await expect(page.getByText("Showing 11–12 of 12 volumes")).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(3);
  });
});
