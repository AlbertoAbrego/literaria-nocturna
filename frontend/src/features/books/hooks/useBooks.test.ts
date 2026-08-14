import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { useBooks } from "@/features/books/hooks/useBooks";
import type { Book, PaginatedResponse } from "@/features/books/types";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import { createBookList } from "@/test/utils/factories/book.factory";
import { createTestQueryClient } from "@/test/utils/query-client";
import { createQueryClientWrapper } from "@/test/utils/render";

describe("useBooks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the loading state", () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns the books from the API on success", async () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pagination).toEqual({ page: 1, limit: 10, total: 5, totalPages: 1 });
    expect(result.current.data?.data).toHaveLength(5);
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

  it("separates cache entries by query parameters", async () => {
    const queryClient = createTestQueryClient();

    const all = renderHook(() => useBooks(), { wrapper: createQueryClientWrapper(queryClient) });
    await waitFor(() => expect(all.result.current.isSuccess).toBe(true));

    const filtered = renderHook(() => useBooks({ title: "whisper" }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(filtered.result.current.isSuccess).toBe(true));

    expect(all.result.current.data?.data).toHaveLength(5);
    expect(filtered.result.current.data?.data).toHaveLength(1);
    expect(filtered.result.current.data?.data[0].title).toBe("The Whisper of the Void");

    expect(queryClient.getQueryData<PaginatedResponse<Book>>(["books", undefined])?.data).toHaveLength(5);
    expect(queryClient.getQueryData<PaginatedResponse<Book>>(["books", { title: "whisper" }])?.data).toHaveLength(
      1,
    );
  });

  it("sends the page as a query parameter and separates cache entries by page", async () => {
    server.use(
      http.get("/api/books", ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        return HttpResponse.json({
          data: page === 1 ? createBookList(2) : createBookList(1),
          pagination: { page, limit: 10, total: 3, totalPages: 2 },
        });
      }),
    );

    const queryClient = createTestQueryClient();

    const pageOne = renderHook(() => useBooks({ page: 1 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(pageOne.result.current.isSuccess).toBe(true));

    const pageTwo = renderHook(() => useBooks({ page: 2 }), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(pageTwo.result.current.isSuccess).toBe(true));

    expect(pageOne.result.current.data?.data).toHaveLength(2);
    expect(pageTwo.result.current.data?.data).toHaveLength(1);
    expect(queryClient.getQueryData<PaginatedResponse<Book>>(["books", { page: 1 }])?.data).toHaveLength(2);
    expect(queryClient.getQueryData<PaginatedResponse<Book>>(["books", { page: 2 }])?.data).toHaveLength(1);
  });
});
