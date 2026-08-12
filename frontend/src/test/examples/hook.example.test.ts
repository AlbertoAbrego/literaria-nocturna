import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { http as apiHttp } from "@/shared/api/http";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import {
  createBookFormData,
  type Book,
  type CreateBookInput,
} from "@/test/utils/factories/book.factory";
import { createTestQueryClient } from "@/test/utils/query-client";
import { createQueryClientWrapper } from "@/test/utils/render";

type BookListResponse = {
  data: Book[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function useBooks() {
  return useQuery<BookListResponse>({
    queryKey: ["books"],
    queryFn: () => apiHttp.get("/books").then((response) => response.data),
  });
}

function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookInput) =>
      apiHttp.post<Book>("/books", input).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}

describe("hook example", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the loading state and resolves with mocked data", async () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pagination.total).toBe(5);
    expect(result.current.data?.data[0].title).toBe("The Whisper of the Void");
  });

  it("surfaces API errors as ApiError instances", async () => {
    server.use(http.get("/api/books", () => internalError()));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("persists mutations through the mock server and invalidates the cache", async () => {
    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(createBookFormData({ title: "The Mutation Grimoire" }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const list = await apiHttp.get<BookListResponse>("/books");
    expect(list.data.pagination.total).toBe(6);
    expect(list.data.data.some((book) => book.title === "The Mutation Grimoire")).toBe(true);
  });

  it("keeps query clients isolated between tests", async () => {
    const first = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(second.result.current.data).toBeUndefined();
    expect(second.result.current.isLoading).toBe(true);

    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
  });
});
