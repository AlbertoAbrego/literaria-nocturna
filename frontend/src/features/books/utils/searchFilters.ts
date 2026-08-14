import {
  GENRES,
  type BooksQueryParams,
  type Genre,
  type SearchFilters,
} from "@/features/books/types";

export { GENRES, type Genre };

export interface GenreOption {
  value: Genre;
  label: string;
}

export const GENRE_OPTIONS: GenreOption[] = GENRES.map((genre) => ({
  value: genre,
  label: genre,
}));

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  title: "",
  author: "",
  genre: "",
};

export const DEBOUNCE_MS = 300;

export function isGenre(value: string): value is Genre {
  return (GENRES as readonly string[]).includes(value);
}

export function parseSearchFilters(searchParams: URLSearchParams): SearchFilters {
  const genre = searchParams.get("genre") ?? "";
  return {
    title: searchParams.get("title") ?? "",
    author: searchParams.get("author") ?? "",
    genre: isGenre(genre) ? genre : "",
  };
}

export function buildSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const title = filters.title.trim();
  const author = filters.author.trim();
  if (title) params.set("title", title);
  if (author) params.set("author", author);
  if (filters.genre) params.set("genre", filters.genre);
  return params;
}

export function toBooksQueryParams(filters: SearchFilters): BooksQueryParams {
  const params: BooksQueryParams = {};
  const title = filters.title.trim();
  const author = filters.author.trim();
  if (title) params.title = title;
  if (author) params.author = author;
  if (filters.genre) params.genre = filters.genre;
  return params;
}

export function filtersEqual(a: SearchFilters, b: SearchFilters): boolean {
  return a.title === b.title && a.author === b.author && a.genre === b.genre;
}