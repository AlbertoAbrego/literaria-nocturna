import type {
  Book,
  CreateBookInput,
  UpdateBookInput,
  PaginatedResponse,
} from "@/features/books/types";
import type { Genre } from "./openapi-types";

export type { Book, Genre, CreateBookInput, UpdateBookInput, PaginatedResponse };

export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: Record<string, string>;
}
