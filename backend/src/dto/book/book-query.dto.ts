import { Genre } from "../../models/book.model";

export type BookQueryDto = {
  genre?: Genre;
  author?: string;
  title?: string;
};
