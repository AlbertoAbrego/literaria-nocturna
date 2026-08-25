import type { Book, Genre, CreateBookInput, UpdateBookInput, PaginatedResponse } from "@/features/books/types";

export type { Book, Genre, CreateBookInput, UpdateBookInput, PaginatedResponse };

export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, string>;
}

export interface BookQueryDto {
  page?: number;
  limit?: number;
  title?: string;
  author?: string;
  genre?: Genre;
}
