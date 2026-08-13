import { http } from "@/shared/api/http";
import type {
  Book,
  BooksQueryParams,
  CreateBookInput,
  PaginatedResponse,
  UpdateBookInput,
} from "@/features/books/types";

export async function getBooks(params?: BooksQueryParams): Promise<PaginatedResponse<Book>> {
  const response = await http.get<PaginatedResponse<Book>>("/books", { params });
  return response.data;
}

export async function getBookById(id: string): Promise<Book> {
  const response = await http.get<Book>(`/books/${id}`);
  return response.data;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const response = await http.post<Book>("/books", input);
  return response.data;
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  const response = await http.patch<Book>(`/books/${id}`, input);
  return response.data;
}
