import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUpdateBook } from "@/features/books/hooks/useUpdateBook";
import { useBook } from "@/features/books/hooks/useBook";
import { ApiError } from "@/shared/api/errors";
import { http as apiHttp } from "@/shared/api/http";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import { createBook, updateBookFormData, type Book } from "@/test/utils/factories/book.factory";
import { createTestQueryClient } from "@/test/utils/query-client";
import { createQueryClientWrapper } from "@/test/utils/render";

const SEED_BOOK_ID = "64f1c2e5a1b2c3d4e5f6a001";

describe("useUpdateBook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the idle state", () => {
    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isNotFound).toBe(false);
  });

  it("updates a book through the mutation and persists it to the server", async () => {
    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(updateBookFormData({ title: "The Revised Grimoire" }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      _id: SEED_BOOK_ID,
      title: "The Revised Grimoire",
    });

    const fetched = await apiHttp.get<Book>(`/books/${SEED_BOOK_ID}`);
    expect(fetched.data.title).toBe("The Revised Grimoire");
  });

  it("reports the pending state while the mutation is in flight", async () => {
    let resolveRequest: (value: HttpResponse<Book>) => void;
    server.use(
      http.patch(
        "/api/books/:id",
        () =>
          new Promise<HttpResponse<Book>>((resolve) => {
            resolveRequest = resolve;
          }),
      ),
    );

    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(updateBookFormData());
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.isIdle).toBe(false);

    await act(async () => {
      resolveRequest(HttpResponse.json(createBook(), { status: 200 }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
  });

  it("surfaces validation errors as ApiError instances", async () => {
    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate({ genre: "Invalid" as never });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const error = result.current.error as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(error.details).toBeDefined();
    expect(error.details).toHaveProperty("genre");
  });

  it("surfaces not-found errors and sets isNotFound", async () => {
    const { result } = renderHook(() => useUpdateBook("64f1c2e5a1b2c3d4e5f6a999"), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(updateBookFormData());
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(result.current.isNotFound).toBe(true);
  });

  it("surfaces conflict errors as ApiError instances", async () => {
    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(
        updateBookFormData({
          title: "Atlas of Forgotten Stars",
          author: "Jorge Almeida",
        }),
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("surfaces internal errors as ApiError instances", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.patch("/api/books/:id", () => internalError()));

    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(updateBookFormData());
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("invalidates the books and detail caches after a successful update", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(updateBookFormData({ title: "The Revised Grimoire" }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books", "detail", SEED_BOOK_ID] });
  });

  it("keeps mutations isolated between query clients", async () => {
    const firstClient = createTestQueryClient();
    const secondClient = createTestQueryClient();

    const second = renderHook(() => useBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(secondClient),
    });
    await waitFor(() => expect(second.result.current.data).toBeDefined());
    expect(second.result.current.data?.title).toBe("The Whisper of the Void");

    const first = renderHook(() => useUpdateBook(SEED_BOOK_ID), {
      wrapper: createQueryClientWrapper(firstClient),
    });

    act(() => {
      first.result.current.mutate(updateBookFormData({ title: "The Revised Grimoire" }));
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    expect(second.result.current.data?.title).toBe("The Whisper of the Void");
  });
});
