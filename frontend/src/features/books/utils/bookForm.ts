import { GENRES } from "@/features/books/types";

export type BookFormField = "title" | "author" | "genre" | "synopsis";

export type BookFormValues = Record<BookFormField, string>;

export type BookFormErrors = Partial<Record<BookFormField, string>>;

export const INITIAL_BOOK_FORM_VALUES: BookFormValues = {
  title: "",
  author: "",
  genre: "",
  synopsis: "",
};

export function validateBookForm(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.author.trim()) errors.author = "Author is required.";
  if (!values.genre) errors.genre = "Select a genre.";
  else if (!(GENRES as readonly string[]).includes(values.genre))
    errors.genre = "Select a valid genre.";
  if (!values.synopsis.trim()) errors.synopsis = "Synopsis is required.";
  return errors;
}
