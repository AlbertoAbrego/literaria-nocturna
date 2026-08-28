import { Genre } from "../../constants/genres";

export type UpdateBookDto = {
  title?: string;
  author?: string;
  genre?: Genre;
  synopsis?: string;
};
