import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDeleteBook } from "@/features/books/hooks/useDeleteBook";
import { useBooks } from "@/features/books/hooks/useBooks";
import { ApiError } from "@/shared/api/errors";
import { http as apiHttp } from "@/shared/api/http";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import type { Book } from "@/test/utils/factories/book.factory";
import { createTestQueryClient } from "@/test/utils/query-client";
import { createQueryClientWrapper } from "@/test/utils/render";

const SEED_BOOK_ID = "64f1c2e5a1b2c3d4e5f6a001";
const SEED_TOTAL = 5;

type BookListResponse = {
  data: Book[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function getCachedList(queryClient: ReturnType<typeof createTestQueryClient>, queryKey?: unknown[]) {
  const key = queryKey ?? ["books", undefined];
  return queryClient.getQueryData<BookListResponse>(key);
}

describe("useDeleteBook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the idle state", () => {
    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isNotFound).toBe(false);
  });

  it("deletes a book through the mutation and persists it to the server", async () => {
    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const list = await apiHttp.get<BookListResponse>("/books");
    expect(list.data.pagination.total).toBe(SEED_TOTAL - 1);
    expect(list.data.data.some((book) => book._id === SEED_BOOK_ID)).toBe(false);
  });

  it("reports the pending state while the mutation is in flight", async () => {
    let resolveRequest: (value: HttpResponse<null>) => void;
    server.use(
      http.delete("/api/books/:id", () =>
        new Promise<HttpResponse<null>>((resolve) => {
          resolveRequest = resolve;
        }),
      ),
    );

    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.isIdle).toBe(false);

    await act(async () => {
      resolveRequest(new HttpResponse(null, { status: 204 }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
  });

  it("surfaces not-found errors and sets isNotFound", async () => {
    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate("64f1c2e5a1b2c3d4e5f6a999");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(result.current.isNotFound).toBe(true);
  });

  it("surfaces internal errors as ApiError instances", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.delete("/api/books/:id", () => internalError()));

    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("optimistically removes the book from the cached list", async () => {
    const queryClient = createTestQueryClient();
    const list = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    const deleteBook = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    await act(async () => {
      deleteBook.result.current.mutate(SEED_BOOK_ID);
    });

    const cached = getCachedList(queryClient);
    expect(cached?.pagination.total).toBe(SEED_TOTAL - 1);
    expect(cached?.data.some((book) => book._id === SEED_BOOK_ID)).toBe(false);

    await waitFor(() => expect(deleteBook.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(getCachedList(queryClient)?.pagination.total).toBe(SEED_TOTAL - 1));
  });

  it("restores the cached list when the mutation fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.delete("/api/books/:id", () => internalError()));

    const queryClient = createTestQueryClient();
    const list = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    const deleteBook = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    act(() => {
      deleteBook.result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(deleteBook.result.current.isError).toBe(true));

    const cached = getCachedList(queryClient);
    expect(cached?.pagination.total).toBe(SEED_TOTAL);
    expect(cached?.data.some((book) => book._id === SEED_BOOK_ID)).toBe(true);
  });

  it("invalidates the books cache and removes the detail query after deletion", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books"] });
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ["books", "detail", SEED_BOOK_ID] });
  });

  it("deletes without error when the list has no cached data", async () => {
    const { result } = renderHook(() => useDeleteBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(SEED_BOOK_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  describe("pagination edge cases", () => {
    it("recalculates totalPages correctly after deletion", async () => {
      const queryClient = createTestQueryClient();
      const queryKey = ["books", { page: 1, limit: 2 }];
      const list = renderHook(() => useBooks({ page: 1, limit: 2 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const cached = getCachedList(queryClient, queryKey);
      expect(cached?.pagination.total).toBe(5);
      expect(cached?.pagination.totalPages).toBe(3);

      const deleteBook = renderHook(() => useDeleteBook(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await act(async () => {
        deleteBook.result.current.mutate(SEED_BOOK_ID);
      });

      const cachedAfterDelete = getCachedList(queryClient, queryKey);
      expect(cachedAfterDelete?.pagination.total).toBe(4);
      expect(cachedAfterDelete?.pagination.totalPages).toBe(2);
    });

    it("recalculates totalPages when deleting last item on page (page 3 -> totalPages becomes 2)", async () => {
      const queryClient = createTestQueryClient();
      const queryKey = ["books", { page: 3, limit: 2 }];
      const list = renderHook(() => useBooks({ page: 3, limit: 2 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const cached = getCachedList(queryClient, queryKey);
      expect(cached?.pagination.page).toBe(3);
      expect(cached?.pagination.totalPages).toBe(3);

      const deleteBook = renderHook(() => useDeleteBook(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await act(async () => {
        deleteBook.result.current.mutate(SEED_BOOK_ID);
      });

      const cachedAfterDelete = getCachedList(queryClient, queryKey);
      expect(cachedAfterDelete?.pagination.total).toBe(4);
      expect(cachedAfterDelete?.pagination.totalPages).toBe(2);
      // Note: page is NOT adjusted in optimistic update; that happens in BooksPage component
      expect(cachedAfterDelete?.pagination.page).toBe(3);
    });

    it("resets to page 1 when deleting only item on page 1 with limit > total", async () => {
      const queryClient = createTestQueryClient();
      const queryKey = ["books", { page: 1, limit: 10 }];
      const list = renderHook(() => useBooks({ page: 1, limit: 10 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const cached = getCachedList(queryClient, queryKey);
      expect(cached?.pagination.total).toBe(5);
      expect(cached?.pagination.totalPages).toBe(1);

      const deleteBook = renderHook(() => useDeleteBook(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await act(async () => {
        deleteBook.result.current.mutate(SEED_BOOK_ID);
      });

      const cachedAfterDelete = getCachedList(queryClient, queryKey);
      expect(cachedAfterDelete?.pagination.total).toBe(4);
      expect(cachedAfterDelete?.pagination.totalPages).toBe(1);
      expect(cachedAfterDelete?.pagination.page).toBe(1);
    });

    it("navigate after deletion shows correct page", async () => {
      const queryClient = createTestQueryClient();
      const list = renderHook(() => useBooks({ page: 3, limit: 2 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const deleteBook = renderHook(() => useDeleteBook(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await act(async () => {
        deleteBook.result.current.mutate(SEED_BOOK_ID);
      });

      await waitFor(() => expect(deleteBook.result.current.isSuccess).toBe(true));

      const refetched = renderHook(() => useBooks({ page: 2, limit: 2 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(refetched.result.current.isSuccess).toBe(true));

      const refetchedData = refetched.result.current.data;
      expect(refetchedData?.pagination.page).toBe(2);
      expect(refetchedData?.pagination.totalPages).toBe(2);
    });

    it("verifies total, totalPages, currentPage consistency after deletion", async () => {
      const queryClient = createTestQueryClient();
      const queryKey = ["books", { page: 2, limit: 2 }];
      const list = renderHook(() => useBooks({ page: 2, limit: 2 }), {
        wrapper: createQueryClientWrapper(queryClient),
      });
      await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

      const cachedBefore = getCachedList(queryClient, queryKey);
      const expectedTotalBefore = cachedBefore?.pagination.total ?? 0;

      const deleteBook = renderHook(() => useDeleteBook(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await act(async () => {
        deleteBook.result.current.mutate(SEED_BOOK_ID);
      });

      const cachedAfter = getCachedList(queryClient, queryKey);
      expect(cachedAfter?.pagination.total).toBe(expectedTotalBefore - 1);
      expect(cachedAfter?.pagination.totalPages).toBe(Math.ceil((expectedTotalBefore - 1) / 2));
      expect(cachedAfter?.pagination.page).toBe(2);
    });
  });
});