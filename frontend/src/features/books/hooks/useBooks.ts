import { useQuery } from "@tanstack/react-query";
import { getBooks } from "@/features/books/api/books.api";
import type { BooksQueryParams } from "@/features/books/types";

export function useBooks(params?: BooksQueryParams) {
  return useQuery({
    queryKey: ["books", params],
    queryFn: () => getBooks(params),
  });
}
