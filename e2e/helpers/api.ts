import type { APIRequestContext, Page } from "@playwright/test";

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
