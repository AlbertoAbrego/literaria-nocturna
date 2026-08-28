import { Genre } from "../../constants/genres";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export type BookQueryDto = {
  genre?: Genre;
  author?: string;
  title?: string;
  page?: number;
  limit?: number;
};
