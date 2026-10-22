import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "../fixtures/test-fixtures";
import { gotoCatalog, gotoCreateBook } from "../helpers/navigation";
import { matchBooksApi } from "../helpers/api";
import {
  createUniqueBookData,
  generateUniqueTitle,
  getE2ERunId,
} from "../fixtures/test-data";
import { isBelowSmBreakpoint, type ViewportProfile } from "../helpers/viewport";

function viewportOf(page: Page): ViewportProfile {
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error("The responsive project must define a viewport");
  }
  return viewport;
}

function isBooksGet(response: {
  request(): { method(): string };
  url(): string;
}): boolean {
  return (
    response.request().method() === "GET" &&
    matchBooksApi(new URL(response.url()))
  );
}

test.describe("Responsive Layout", () => {
  let createdBookIds: string[] = [];
  let filterTag = "";

  test.afterEach(async ({ request }) => {
    for (const id of createdBookIds) {
      await request.delete(`/api/books/${id}`);
    }
    createdBookIds = [];
  });

  test.beforeEach(() => {
    filterTag = `RESP_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  });

  async function createBook(
    request: APIRequestContext,
    overrides: Parameters<typeof createUniqueBookData>[0] = {},
  ): Promise<string> {
    const response = await request.post("/api/books", {
      data: createUniqueBookData(overrides),
    });
    const body = (await response.json()) as { _id: string };
    createdBookIds.push(body._id);
    return body._id;
  }

  test(
    "TC-H40-001: navbar links stay visible and tappable",
    { tag: "@responsive" },
    async ({ page }) => {
      const viewport = viewportOf(page);
      await page.goto("/");

      const home = page.getByRole("link", { name: "Home" });
      const books = page.getByRole("link", { name: "Books" });
      for (const link of [home, books]) {
        await expect(link).toBeVisible();
        const box = (await link.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      }

      await books.click();
      await expect(page).toHaveURL(/\/books$/);
    },
  );

  test(
    "TC-H40-002: search inputs stack below sm and sit side-by-side at sm",
    { tag: "@responsive" },
    async ({ page }) => {
      const viewport = viewportOf(page);
      await gotoCatalog(page);

      const titleInput = page.getByLabel("Title");
      const authorInput = page.getByLabel("Author");
      await expect(titleInput).toBeVisible();
      await expect(authorInput).toBeVisible();

      const titleBox = (await titleInput.boundingBox())!;
      const authorBox = (await authorInput.boundingBox())!;
      if (isBelowSmBreakpoint(viewport)) {
        expect(authorBox.y).toBeGreaterThanOrEqual(
          titleBox.y + titleBox.height,
        );
      } else {
        expect(Math.abs(authorBox.y - titleBox.y)).toBeLessThanOrEqual(5);
        expect(authorBox.x).toBeGreaterThanOrEqual(titleBox.x + titleBox.width);
      }

      await titleInput.fill("Responsiveness");
      await authorInput.fill("Playwright");
      await expect(titleInput).toHaveValue("Responsiveness");
      await expect(authorInput).toHaveValue("Playwright");
    },
  );

  test(
    "TC-H40-003: genre filter spans full width on mobile and is constrained at sm",
    { tag: "@responsive" },
    async ({ page }) => {
      const viewport = viewportOf(page);
      await gotoCatalog(page);

      const titleBox = (await page.getByLabel("Title").boundingBox())!;
      const genreSelect = page.getByLabel("Genre");
      await expect(genreSelect).toBeVisible();
      const genreBox = (await genreSelect.boundingBox())!;

      if (isBelowSmBreakpoint(viewport)) {
        expect(Math.abs(genreBox.width - titleBox.width)).toBeLessThanOrEqual(
          20,
        );
      } else {
        expect(genreBox.width).toBeGreaterThanOrEqual(210);
        expect(genreBox.width).toBeLessThanOrEqual(240);
        expect(genreBox.width).toBeLessThan(titleBox.width);
      }

      const genreResponse = page.waitForResponse(isBooksGet);
      await genreSelect.selectOption("Fantasy");
      await genreResponse;
      await expect(page.getByText("1 active filter")).toBeVisible();
    },
  );

  test(
    "TC-H40-004: catalog table scrolls horizontally on mobile and fits at sm",
    { tag: "@responsive" },
    async ({ page, request }) => {
      const viewport = viewportOf(page);
      // The tablet branch asserts the table fits (no horizontal scroll) at
      // 768px, so the row's cells must keep the table's min-content width
      // under the ~718px scroller width. The title is built as two short
      // words after the required `E2E:<runId>:` teardown prefix so the
      // longest unbreakable word stays ~15ch instead of one ~30ch token
      // that alone would force the table to overflow the tablet viewport.
      const tableTag = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
      const bookData = createUniqueBookData({
        title: `E2E:${getE2ERunId()}: ${tableTag}`,
        synopsis: "Scroll.",
      });
      const response = await request.post("/api/books", { data: bookData });
      const body = (await response.json()) as { _id: string };
      createdBookIds.push(body._id);

      await gotoCatalog(page);
      const filterResponse = page.waitForResponse(isBooksGet);
      await page.getByLabel("Title").fill(tableTag);
      await filterResponse;
      await expect(
        page.getByRole("cell", { name: bookData.title, exact: true }),
      ).toBeVisible();

      const table = page.getByRole("table", { name: "Book catalog" });
      await expect(table).toBeVisible();
      const actions = page.getByRole("columnheader", { name: "Actions" });

      const metrics = await table.evaluate((el) => {
        const scroller = el.parentElement;
        if (!scroller) return null;
        return {
          scrollWidth: scroller.scrollWidth,
          clientWidth: scroller.clientWidth,
        };
      });
      expect(metrics).not.toBeNull();

      if (isBelowSmBreakpoint(viewport)) {
        expect(metrics!.scrollWidth).toBeGreaterThan(metrics!.clientWidth);
        await expect(actions).not.toBeInViewport();
        await table.evaluate((el) => {
          const scroller = el.parentElement;
          if (scroller) scroller.scrollLeft = scroller.scrollWidth;
        });
        await expect(actions).toBeInViewport();
      } else {
        expect(metrics!.scrollWidth).toBeLessThanOrEqual(
          metrics!.clientWidth + 1,
        );
        for (const column of [
          "Title",
          "Author",
          "Genre",
          "Synopsis",
          "Actions",
        ]) {
          const header = page.getByRole("columnheader", { name: column });
          await expect(header).toBeInViewport();
          const box = (await header.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    },
  );

  test(
    "TC-H40-005: details metadata switches from one column to two at sm and the back link is tappable",
    { tag: "@responsive" },
    async ({ page, request }) => {
      const viewport = viewportOf(page);
      const bookData = createUniqueBookData();
      const bookId = await createBook(request, bookData);

      await page.goto(`/books/${bookId}`);
      await expect(
        page.getByRole("heading", { name: bookData.title }),
      ).toBeVisible();

      // Google Fonts are loaded with display=swap; the late swap reflows text
      // metrics and shifts geometry between measurements, so settle fonts
      // before reading bounding boxes (Story 43, TC-H40-005 flake).
      await page.evaluate(() => document.fonts.ready);

      // dt/dd expose the ARIA term/definition roles, so metadata items are
      // located semantically instead of via structural `dl > div` CSS
      // (Story 43). Item boundaries are equivalent: an item starts at its
      // term and ends at its definition.
      const terms = page.getByRole("term");
      const definitions = page.getByRole("definition");
      await expect(terms).toHaveCount(2);
      await expect(definitions).toHaveCount(2);
      const firstTerm = (await terms.nth(0).boundingBox())!;
      const firstDef = (await definitions.nth(0).boundingBox())!;
      const secondTerm = (await terms.nth(1).boundingBox())!;

      if (isBelowSmBreakpoint(viewport)) {
        expect(secondTerm.y).toBeGreaterThanOrEqual(
          firstDef.y + firstDef.height,
        );
      } else {
        expect(Math.abs(secondTerm.y - firstTerm.y)).toBeLessThanOrEqual(2);
        expect(secondTerm.x).toBeGreaterThan(firstTerm.x);
      }

      const backLink = page.getByRole("link", { name: /back to catalog/i });
      await expect(backLink).toBeVisible();
      const backBox = (await backLink.boundingBox())!;
      expect(backBox.x).toBeGreaterThanOrEqual(0);
      expect(backBox.x + backBox.width).toBeLessThanOrEqual(viewport.width);

      await backLink.click();
      await expect(page).toHaveURL(/\/books$/);
    },
  );

  test(
    "TC-H40-006: create form is fully usable with visible validation errors",
    { tag: "@responsive" },
    async ({ page, request }) => {
      const viewport = viewportOf(page);
      const bookData = createUniqueBookData();

      await gotoCreateBook(page);
      const fields = [
        page.getByLabel("Title"),
        page.getByLabel("Author"),
        page.getByLabel("Genre"),
        page.getByLabel("Synopsis"),
      ];
      for (const field of fields) {
        await expect(field).toBeVisible();
        const box = (await field.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }
      const submit = page.getByRole("button", { name: "Catalog the Book" });
      await expect(submit).toBeVisible();
      const submitBox = (await submit.boundingBox())!;
      expect(submitBox.x + submitBox.width).toBeLessThanOrEqual(viewport.width);

      await submit.click();
      await expect(page.getByText("Title is required.")).toBeVisible();
      await expect(page.getByText("Author is required.")).toBeVisible();
      await expect(page.getByText("Select a genre.")).toBeVisible();
      await expect(page.getByText("Synopsis is required.")).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);

      await fields[0].fill(bookData.title);
      await fields[1].fill(bookData.author);
      await fields[2].selectOption(bookData.genre);
      await fields[3].fill(bookData.synopsis);

      const createResponse = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes("/api/books"),
      );
      await submit.click();
      const created = await createResponse;
      const createdBody = (await created.json()) as { _id: string };
      createdBookIds.push(createdBody._id);
      await expect(page).toHaveURL(/\/books$/);
    },
  );

  test(
    "TC-H40-007: delete modal is centered, buttons are tappable, and focus is trapped",
    { tag: "@responsive" },
    async ({ page, request }) => {
      const viewport = viewportOf(page);
      const bookData = createUniqueBookData();
      await createBook(request, { title: bookData.title });

      await gotoCatalog(page);
      const filterResponse = page.waitForResponse(isBooksGet);
      await page.getByLabel("Title").fill(bookData.title);
      await filterResponse;
      await expect(
        page.getByRole("cell", { name: bookData.title, exact: true }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: `Delete ${bookData.title}` })
        .click();
      const modalTitle = `Delete "${bookData.title}"?`;
      const dialog = page.getByRole("dialog", { name: modalTitle });
      await expect(dialog).toBeVisible();

      const dialogBox = (await dialog.boundingBox())!;
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.y).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewport.width);
      expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(
        viewport.height,
      );
      expect(
        Math.abs(dialogBox.x + dialogBox.width / 2 - viewport.width / 2),
      ).toBeLessThanOrEqual(2);

      const cancel = dialog.getByRole("button", { name: "Cancel" });
      const confirm = dialog.getByRole("button", { name: "Delete" });
      for (const button of [cancel, confirm]) {
        await expect(button).toBeVisible();
        const box = (await button.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.x).toBeGreaterThanOrEqual(dialogBox.x);
        expect(box.x + box.width).toBeLessThanOrEqual(
          dialogBox.x + dialogBox.width,
        );
      }

      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        const focusInsideDialog = await page.evaluate(() => {
          const dialogElement = document.querySelector('[role="dialog"]');
          return (
            !!dialogElement && dialogElement.contains(document.activeElement)
          );
        });
        expect(focusInsideDialog).toBe(true);
      }

      await cancel.click();
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole("cell", { name: bookData.title, exact: true }),
      ).toBeVisible();
    },
  );

  test(
    "TC-H40-008: pagination controls are reachable, sized for touch, and navigate across pages",
    { tag: "@responsive" },
    async ({ page, request }) => {
      const viewport = viewportOf(page);
      for (let i = 1; i <= 11; i++) {
        await createBook(request, {
          title: generateUniqueTitle(`${filterTag}_${i}`),
        });
      }

      await gotoCatalog(page);
      const filterResponse = page.waitForResponse(isBooksGet);
      await page.getByLabel("Title").fill(filterTag);
      await filterResponse;
      await expect(page.getByText("1 active filter")).toBeVisible();

      const pagination = page.getByRole("navigation", { name: "Pagination" });
      await expect(pagination).toBeVisible();
      await expect(
        pagination.getByRole("button", { name: "Previous" }),
      ).toBeDisabled();

      const controls = pagination.getByRole("button");
      const controlCount = await controls.count();
      expect(controlCount).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < controlCount; i++) {
        const box = (await controls.nth(i).boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }

      const pageTwoResponse = page.waitForResponse(
        (r) =>
          isBooksGet(r) && new URL(r.url()).searchParams.get("page") === "2",
      );
      await pagination.getByRole("button", { name: "Go to page 2" }).click();
      await pageTwoResponse;
      await expect(page.getByText(/Showing 11.11 of 11 volumes/)).toBeVisible();
      await expect(
        pagination.getByRole("button", { name: "Next" }),
      ).toBeDisabled();
      await expect(
        pagination.getByRole("button", { name: "Previous" }),
      ).toBeEnabled();

      await pagination.getByRole("button", { name: "Previous" }).click();
      await expect(page.getByText(/Showing 1.10 of 11 volumes/)).toBeVisible();
      await expect(
        pagination.getByRole("button", { name: "Previous" }),
      ).toBeDisabled();
    },
  );
});
