import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBook } from "@/features/books/api/books.api";
import type { Book, PaginatedResponse } from "@/features/books/types";
import { ApiError } from "@/shared/api/errors";

export function useDeleteBook() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteBook,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["books"] });
      const previousLists = queryClient.getQueriesData<PaginatedResponse<Book>>({
        queryKey: ["books"],
      });

      queryClient.setQueriesData<PaginatedResponse<Book>>(
        { queryKey: ["books"] },
        (current) => removeBookFromList(current, id),
      );

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.removeQueries({ queryKey: ["books", "detail", id] });
    },
  });

  return {
    ...mutation,
    isNotFound: mutation.error instanceof ApiError && mutation.error.status === 404,
  };
}

function removeBookFromList(
  current: PaginatedResponse<Book> | undefined,
  id: string,
): PaginatedResponse<Book> | undefined {
  if (!current) {
    return current;
  }
  const newTotal = Math.max(0, current.pagination.total - 1);
  const newTotalPages = Math.ceil(newTotal / current.pagination.limit);
  return {
    ...current,
    data: current.data.filter((book) => book._id !== id),
    pagination: {
      ...current.pagination,
      total: newTotal,
      totalPages: newTotalPages,
    },
  };
}