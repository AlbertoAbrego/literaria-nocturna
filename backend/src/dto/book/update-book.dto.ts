import { Genre } from "../../models/book.model";

export type UpdateBookDto = {
  title?: string;
  author?: string;
  genre?: Genre;
  synopsis?: string;
};