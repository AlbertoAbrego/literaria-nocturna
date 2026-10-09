import {
  expect,
  type APIRequestContext,
  type Page,
  type Response,
} from "@playwright/test";
import { isE2EOwned, extractRunId } from "../fixtures/test-data";

// URL predicate for page.route() interception of Books API requests.
//
// A glob matching any URL containing /api/books also matches Vite dev-server
// module files (e.g. /src/features/books/api/books.api.ts), which would break
// the app under test. Matching on the pathname prefix avoids that collision.
export function matchBooksApi(url: URL): boolean {
  return /^\/api\/books(\/|$)/.test(url.pathname);
}

interface BookData {
  _id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
}

interface PaginatedResponse {
  data: BookData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function deleteAllBooks(
  request: APIRequestContext,
): Promise<void> {
  const response = await request.get("/api/books?limit=100");
  const body = (await response.json()) as PaginatedResponse;

  for (const book of body.data) {
    await request.delete(`/api/books/${book._id}`);
  }
}

export async function deleteBooksByTitlePrefix(
  request: APIRequestContext,
  prefix: string,
): Promise<void> {
  const response = await request.get("/api/books?limit=100");
  const body = (await response.json()) as PaginatedResponse;

  for (const book of body.data) {
    if (book.title.startsWith(prefix)) {
      await request.delete(`/api/books/${book._id}`);
    }
  }
}

export async function deleteBooksByRunId(
  request: APIRequestContext,
  runId: string,
): Promise<number> {
  const response = await request.get("/api/books?limit=1000");
  if (!response.ok()) {
    return 0;
  }
  const body = (await response.json()) as PaginatedResponse;
  const runPrefix = `E2E:${runId}:`;
  const runBooks = body.data.filter((b) => b.title.startsWith(runPrefix));

  let deleted = 0;
  for (const book of runBooks) {
    const del = await request.delete(`/api/books/${book._id}`);
    if (del.ok() || del.status() === 404) {
      deleted++;
    }
  }
  return deleted;
}

export async function deleteE2EOwnedBooks(
  request: APIRequestContext,
): Promise<number> {
  const response = await request.get("/api/books?limit=1000");
  if (!response.ok()) {
    return 0;
  }
  const body = (await response.json()) as PaginatedResponse;
  const runBooks = body.data.filter((b) => isE2EOwned(b.title));

  let deleted = 0;
  for (const book of runBooks) {
    const del = await request.delete(`/api/books/${book._id}`);
    if (del.ok() || del.status() === 404) {
      deleted++;
    }
  }
  return deleted;
}

export async function getBookByTitle(
  request: APIRequestContext,
  title: string,
): Promise<BookData | null> {
  const response = await request.get(
    `/api/books?title=${encodeURIComponent(title)}&limit=10`,
  );
  const body = (await response.json()) as PaginatedResponse;
  return body.data.find((book) => book.title === title) ?? null;
}

export function getCurrentRunId(): string {
  return process.env.E2E_RUN_ID || "local";
}

// Contract assertion helpers (Story 39): validate the frontend -> backend
// contract as exercised through real UI flows (request method/path/query/body,
// response status and body shape). UI outcome assertions live in
// ../helpers/assertions.ts.

export interface ContractBook extends BookData {
  createdAt: string;
  updatedAt: string;
}

export interface ContractPaginatedBooks {
  data: ContractBook[];
  pagination: PaginatedResponse["pagination"];
}

export interface ContractErrorBody {
  message: string;
  code: string;
  details?: Record<string, string>;
}

export async function expectRequestMatches(
  response: Response,
  expected: {
    method: string;
    pathname: string;
    queryParams?: Record<string, string>;
    bodyShape?: Record<string, unknown>;
  },
): Promise<void> {
  const request = response.request();
  expect(request.method()).toBe(expected.method);

  const url = new URL(request.url());
  expect(url.pathname).toBe(expected.pathname);

  if (expected.queryParams) {
    for (const [key, value] of Object.entries(expected.queryParams)) {
      expect(url.searchParams.get(key)).toBe(value);
    }
  }

  if (expected.bodyShape) {
    expect(["POST", "PATCH", "PUT"]).toContain(request.method());
    const body = JSON.parse(request.postData() ?? "{}") as unknown;
    expect(body).toMatchObject(expected.bodyShape);
  }
}

export async function expectSuccessResponse(
  response: Response,
  expectedShape: "book",
): Promise<ContractBook>;
export async function expectSuccessResponse(
  response: Response,
  expectedShape: "paginated",
): Promise<ContractPaginatedBooks>;
export async function expectSuccessResponse(
  response: Response,
  expectedShape: "empty",
): Promise<void>;
export async function expectSuccessResponse(
  response: Response,
  expectedShape: "book" | "paginated" | "empty",
): Promise<ContractBook | ContractPaginatedBooks | void> {
  expect(response.ok()).toBeTruthy();

  if (expectedShape === "empty") {
    expect(await response.text()).toBe("");
    return;
  }

  const body = (await response.json()) as Record<string, unknown>;

  if (expectedShape === "book") {
    expect(body).toMatchObject({
      _id: expect.any(String),
      title: expect.any(String),
      author: expect.any(String),
      genre: expect.any(String),
      synopsis: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    return body as ContractBook;
  }

  expect(Array.isArray((body as ContractPaginatedBooks).data)).toBe(true);
  expect(body).toMatchObject({
    data: expect.arrayContaining([
      expect.objectContaining({ _id: expect.any(String) }),
    ]),
    pagination: {
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    },
  });
  return body as ContractPaginatedBooks;
}

export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedCode: string,
): Promise<ContractErrorBody> {
  expect(response.status()).toBe(expectedStatus);
  const body = (await response.json()) as ContractErrorBody;
  expect(body).toMatchObject({
    message: expect.any(String),
    code: expectedCode,
  });
  return body;
}

// BREAKING CHANGE DETECTION PATTERN (documentation, not executed):
// If the backend renames `Book._id` -> `Book.id`, expectSuccessResponse(..., "book")
// fails with: Expected object to have property "_id".
// If pagination.totalPages is removed from the list response,
// expectSuccessResponse(..., "paginated") fails on the pagination shape.
// If the error code drifts ("VALIDATION_ERROR" -> "VALIDATION_FAILED"),
// expectErrorResponse(response, 400, "VALIDATION_ERROR") fails on the exact match.
// toMatchObject tolerates added fields, so additive changes stay forward compatible.
