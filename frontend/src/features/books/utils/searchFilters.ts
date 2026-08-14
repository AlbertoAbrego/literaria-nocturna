import { GENRES, type Genre, type SearchFilters } from "@/features/books/types";

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