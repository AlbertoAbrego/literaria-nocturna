import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { http as apiHttp } from "@/shared/api/http";
import { useBooks } from "@/features/books/hooks/useBooks";
import { useCreateBook } from "@/features/books/hooks/useCreateBook";
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

const SEED_TOTAL = 5;

describe("useCreateBook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in the idle state", () => {
    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("creates a book through the mutation and persists it to the server", async () => {
    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(createBookFormData({ title: "The Mutation Grimoire" }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ title: "The Mutation Grimoire" });

    const list = await apiHttp.get<BookListResponse>("/books");
    expect(list.data.pagination.total).toBe(SEED_TOTAL + 1);
    expect(list.data.data.some((book) => book.title === "The Mutation Grimoire")).toBe(true);
  });

  it("reports the pending state while the mutation is in flight", async () => {
    let resolveRequest: (value: HttpResponse<CreateBookInput>) => void;
    server.use(
      http.post(
        "/api/books",
        () =>
          new Promise<HttpResponse<CreateBookInput>>((resolve) => {
            resolveRequest = resolve;
          }),
      ),
    );

    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(createBookFormData());
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.isIdle).toBe(false);

    await act(async () => {
      resolveRequest(HttpResponse.json(createBookFormData(), { status: 201 }));
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
  });

  it("surfaces validation errors as ApiError instances", async () => {
    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate({
        title: "",
        author: "",
        genre: "",
        synopsis: "",
      } as unknown as CreateBookInput);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const error = result.current.error as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(error.details).toBeDefined();
    expect(Object.keys(error.details!)).length.greaterThan(0);
  });

  it("surfaces conflict errors as ApiError instances", async () => {
    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(
        createBookFormData({
          title: "The Whisper of the Void",
          author: "Isabella Marchetti",
        }),
      );
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("surfaces internal errors as ApiError instances", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.post("/api/books", () => internalError()));

    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(createTestQueryClient()),
    });

    act(() => {
      result.current.mutate(createBookFormData());
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
  });

  it("invalidates the books cache after a successful creation", async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(createBookFormData());
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books"] });
  });

  it("keeps mutations isolated between query clients", async () => {
    const firstClient = createTestQueryClient();
    const secondClient = createTestQueryClient();

    const second = renderHook(() => useBooks(), {
      wrapper: createQueryClientWrapper(secondClient),
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(second.result.current.data?.pagination.total).toBe(5);

    const first = renderHook(() => useCreateBook(), {
      wrapper: createQueryClientWrapper(firstClient),
    });

    act(() => {
      first.result.current.mutate(createBookFormData({ title: "The Mutation Grimoire" }));
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    expect(second.result.current.data?.pagination.total).toBe(5);
    expect(
      second.result.current.data?.data.some((book) => book.title === "The Mutation Grimoire"),
    ).toBe(false);
  });

  describe("data integrity - unique constraint (title, author)", () => {
    it("same title with different author succeeds", async () => {
      const { result } = renderHook(() => useCreateBook(), {
        wrapper: createQueryClientWrapper(createTestQueryClient()),
      });

      await act(async () => {
        result.current.mutate(createBookFormData({ title: "Same Title", author: "Author One" }));
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.title).toBe("Same Title");
      expect(result.current.data?.author).toBe("Author One");

      await act(async () => {
        result.current.mutate(createBookFormData({ title: "Same Title", author: "Author Two" }));
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.title).toBe("Same Title");
      expect(result.current.data?.author).toBe("Author Two");
    });

    it("same author with different title succeeds", async () => {
      const { result } = renderHook(() => useCreateBook(), {
        wrapper: createQueryClientWrapper(createTestQueryClient()),
      });

      await act(async () => {
        result.current.mutate(createBookFormData({ title: "Title One", author: "Same Author" }));
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.title).toBe("Title One");
      expect(result.current.data?.author).toBe("Same Author");

      await act(async () => {
        result.current.mutate(createBookFormData({ title: "Title Two", author: "Same Author" }));
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.title).toBe("Title Two");
      expect(result.current.data?.author).toBe("Same Author");
    });

    it("duplicate title + author returns 409 CONFLICT", async () => {
      const { result } = renderHook(() => useCreateBook(), {
        wrapper: createQueryClientWrapper(createTestQueryClient()),
      });

      await act(async () => {
        result.current.mutate(
          createBookFormData({ title: "Duplicate Title", author: "Duplicate Author" }),
        );
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(async () => {
        result.current.mutate(
          createBookFormData({ title: "Duplicate Title", author: "Duplicate Author" }),
        );
      });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error).toMatchObject({ status: 409, code: "CONFLICT" });
    });

    it("concurrent duplicate creation returns 409 for second request", async () => {
      const client = createTestQueryClient();

      const first = renderHook(() => useCreateBook(), {
        wrapper: createQueryClientWrapper(client),
      });

      const second = renderHook(() => useCreateBook(), {
        wrapper: createQueryClientWrapper(createTestQueryClient()),
      });

      const dto = createBookFormData({ title: "Concurrent Title", author: "Concurrent Author" });

      await Promise.all([
        act(async () => {
          first.result.current.mutate(dto);
        }),
        act(async () => {
          second.result.current.mutate(dto);
        }),
      ]);

      await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
      await waitFor(() => expect(second.result.current.isError).toBe(true));
      expect(second.result.current.error).toBeInstanceOf(ApiError);
      expect(second.result.current.error).toMatchObject({ status: 409, code: "CONFLICT" });
    });
  });
});
