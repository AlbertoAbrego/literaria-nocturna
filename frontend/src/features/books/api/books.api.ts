import { http } from "@/shared/api/http";
import type { Book, BooksQueryParams, PaginatedResponse } from "@/features/books/types";

export async function getBooks(params?: BooksQueryParams): Promise<PaginatedResponse<Book>> {
  const response = await http.get<PaginatedResponse<Book>>("/books", { params });
  return response.data;
}
