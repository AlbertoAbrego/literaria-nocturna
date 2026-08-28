import { renderHook, waitFor } from "@testing-library/react";
import { http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { useBook } from "@/features/books/hooks/useBook";
import { server } from "@/test/server";
import { internalError, notFoundError } from "@/test/handlers/errors";
import { createTestQueryClient } from "@/test/utils/query-client";
import { createQueryClientWrapper } from "@/test/utils/render";

const SEED_ID = "64f1c2e5a1b2c3d4e5f6a001";

describe("useBook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the loading state", () => {
    const { result } = renderHook(() => useBook(SEED_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("fetches the book from the API on success", async () => {
    const { result } = renderHook(() => useBook(SEED_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toMatchObject({
      _id: SEED_ID,
      title: "The Whisper of the Void",
      author: "Isabella Marchetti",
    });
    expect(result.current.isNotFound).toBe(false);
  });

  it("separates cache entries by book id", async () => {
    const queryClient = createTestQueryClient();

    const first = renderHook(() => useBook(SEED_ID), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(first.result.current.data).toBeDefined());

    const second = renderHook(() => useBook("64f1c2e5a1b2c3d4e5f6a002"), {
      wrapper: createQueryClientWrapper(queryClient),
    });
    await waitFor(() => expect(second.result.current.data).toBeDefined());

    expect(first.result.current.data?.author).toBe("Isabella Marchetti");
    expect(second.result.current.data?.author).toBe("Jorge Almeida");

    expect(queryClient.getQueryData(["books", "detail", SEED_ID])).toMatchObject({ _id: SEED_ID });
  });

  it("reports a not-found state for 404 responses", async () => {
    server.use(http.get("/api/books/:id", () => notFoundError("Book not found")));

    const { result } = renderHook(() => useBook(SEED_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isNotFound).toBe(true));

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(result.current.data).toBeUndefined();
  });

  it("distinguishes a not-found state from other API errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("/api/books/:id", () => internalError()));

    const { result } = renderHook(() => useBook(SEED_ID), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isNotFound).toBe(false);
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("does not fetch while the id is missing", () => {
    const { result } = renderHook(() => useBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
