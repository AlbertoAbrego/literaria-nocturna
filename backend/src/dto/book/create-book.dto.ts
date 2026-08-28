import { Genre } from "../../constants/genres";

export type CreateBookDto = {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
};
