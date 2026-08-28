import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBook } from "@/features/books/api/books.api";
import type { UpdateBookInput } from "@/features/books/types";
import { ApiError } from "@/shared/api/errors";

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UpdateBookInput) => updateBook(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["books", "detail", id] });
    },
  });

  return {
    ...mutation,
    isNotFound: mutation.error instanceof ApiError && mutation.error.status === 404,
  };
}
