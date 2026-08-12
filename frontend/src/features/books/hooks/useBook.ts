import { useQuery } from "@tanstack/react-query";
import { getBookById } from "@/features/books/api/books.api";
import { ApiError } from "@/shared/api/errors";

export function useBook(id?: string) {
  const query = useQuery({
    queryKey: ["books", "detail", id],
    queryFn: () => getBookById(id ?? ""),
    enabled: Boolean(id),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isNotFound: query.error instanceof ApiError && query.error.status === 404,
    refetch: query.refetch,
  };
}