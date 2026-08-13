export const GENRES = [
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
] as const;

export type Genre = (typeof GENRES)[number];

export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateBookInput {
  title: string;
  author: string;
  genre: string;
  synopsis: string;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  genre?: string;
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
  genre?: string;
}

// The backend responds to a successful deletion with 204 No Content (no body).
export type DeleteBookResponse = void;
