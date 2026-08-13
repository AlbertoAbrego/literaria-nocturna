import { QueryClient } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import BooksPage from "@/pages/BooksPage";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import { createBookList } from "@/test/utils/factories/book.factory";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";

function paginatedBooks() {
  const books = createBookList(5);
  return {
    data: books,
    pagination: { page: 1, limit: 10, total: books.length, totalPages: 1 },
  };
}

describe("BooksPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads books from the mocked API and renders them", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });

    expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.getByText("The Orchard Under the Moon")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("retries the request after a transient failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = paginatedBooks();
    let attempts = 0;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    });

    server.use(
      http.get("/api/books", () => {
        attempts += 1;
        if (attempts === 1) {
          return internalError();
        }
        return HttpResponse.json(response);
      }),
    );

    renderWithProviders(<BooksPage />, { route: "/books", queryClient });

    await waitFor(() => expect(screen.getByText(response.data[0].title)).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("recovers from an error state when retry is triggered", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("/api/books", () => internalError()));

    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("The archive could not be reached.")).toBeInTheDocument();

    server.resetHandlers();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("deletes a book through the confirmation flow and refreshes the list", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: 60_000 } },
    });

    renderWithProviders(<BooksPage />, { route: "/books", queryClient });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);

    await userEvent.click(
      screen.getByRole("button", { name: "Delete The Whisper of the Void" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("The Whisper of the Void")).not.toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(5);
  });

  it("keeps the book when the deletion is cancelled", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.click(
      screen.getByRole("button", { name: "Delete The Whisper of the Void" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes multiple books sequentially", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);

    for (const title of ["The Whisper of the Void", "Atlas of Forgotten Stars"]) {
      await userEvent.click(screen.getByRole("button", { name: `Delete ${title}` }));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(screen.queryByText(title)).not.toBeInTheDocument());
    }

    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("supports keyboard navigation through the delete flow", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    const trigger = screen.getByRole("button", { name: "Delete The Whisper of the Void" });
    trigger.focus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
