import type { Genre } from "@/test/contract/openapi-types";

export type { Genre };

export const GENRES: readonly Genre[] = [
  "Romance",
  "Thriller",
  "Fantasy",
  "Science Fiction",
  "Dystopia",
  "Historical Fiction",
  "Adventure",
  "Self Help",
  "Popular Science",
  "Horror",
  "Young Adult",
  "Children",
  "Health",
  "Sports",
  "Cooking",
];

export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  genre?: Genre;
  synopsis?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BooksQueryParams {
  page?: number;
  limit?: number;
  title?: string;
  author?: string;
  genre?: Genre;
}

export interface SearchFilters {
  title: string;
  author: string;
  genre: Genre | "";
}

// The backend responds to a successful deletion with 204 No Content (no body).
export type DeleteBookResponse = void;
