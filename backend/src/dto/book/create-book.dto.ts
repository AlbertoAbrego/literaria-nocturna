import { Genre } from "../../models/book.model";

export type CreateBookDto = {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
};
