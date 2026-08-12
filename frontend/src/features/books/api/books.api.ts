import { http } from "@/shared/api/http";
import type { Book, BooksQueryParams, PaginatedResponse } from "@/features/books/types";

export async function getBooks(params?: BooksQueryParams): Promise<PaginatedResponse<Book>> {
  const response = await http.get<PaginatedResponse<Book>>("/books", { params });
  return response.data;
}

export async function getBookById(id: string): Promise<Book> {
  const response = await http.get<Book>(`/books/${id}`);
  return response.data;
}
