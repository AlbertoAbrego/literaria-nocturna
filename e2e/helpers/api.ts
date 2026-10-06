import type { APIRequestContext, Page } from "@playwright/test";
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
