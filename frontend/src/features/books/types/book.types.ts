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
