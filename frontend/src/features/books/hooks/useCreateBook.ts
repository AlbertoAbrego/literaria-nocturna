import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBook } from "@/features/books/api/books.api";

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}
