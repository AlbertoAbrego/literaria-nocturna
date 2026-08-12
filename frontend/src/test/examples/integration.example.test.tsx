import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, RouterProvider, createMemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { http as apiHttp } from "@/shared/api/http";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";
import type { Book } from "@/test/utils/factories/book.factory";

type BookListResponse = {
  data: Book[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function useBooks(search: string) {
  return useQuery<BookListResponse>({
    queryKey: ["books", { search }],
    queryFn: () =>
      apiHttp
        .get("/books", { params: { title: search || undefined } })
        .then((response) => response.data),
  });
}

function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiHttp.delete(`/books/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}

function Home() {
  return (
    <main>
      <h1>Reading Room</h1>
      <Link to="/books">Consult the catalog</Link>
    </main>
  );
}

function Books() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useBooks(search);
  const removeBook = useDeleteBook();

  return (
    <main>
      <h1>Catalog</h1>
      <Link to="/">Home</Link>
      <input
        aria-label="Search the catalog"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {isLoading && <p>Opening the archive...</p>}
      {isError && <p role="alert">The archive could not be reached.</p>}
      {data && (
        <ul>
          {data.data.map((book) => (
            <li key={book._id}>
              <span>
                {book.title} — {book.author}
              </span>
              <button
                type="button"
                aria-label={`Delete ${book.title}`}
                onClick={() => removeBook.mutate(book._id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function renderBooksApp() {
  const router = createMemoryRouter(
    [
      { path: "/", element: <Home /> },
      { path: "/books", element: <Books /> },
    ],
    { initialEntries: ["/books"] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

describe("integration example", () => {
  it("loads books from the mock API and renders the list", async () => {
    renderBooksApp();

    expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument();

    await waitForList();
    expect(screen.getByText(/The Whisper of the Void/)).toBeInTheDocument();
    expect(screen.getByText(/The Orchard Under the Moon/)).toBeInTheDocument();
  });

  it("refetches with a derived query key when the search input changes", async () => {
    renderBooksApp();
    await waitForList();

    await userEvent.type(screen.getByRole("textbox", { name: "Search the catalog" }), "whisper");

    await waitFor(() => {
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });
    expect(screen.getByText(/The Whisper of the Void/)).toBeInTheDocument();
  });

  it("deletes a book, invalidates the cache, and refetches the remaining list", async () => {
    renderBooksApp();
    await waitForList();

    await userEvent.click(screen.getByRole("button", { name: "Delete The Whisper of the Void" }));

    await waitFor(() => {
      expect(screen.queryByText(/The Whisper of the Void/)).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("navigates between routes through the memory router", async () => {
    renderBooksApp();
    await waitForList();

    await userEvent.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.getByRole("heading", { name: "Reading Room" })).toBeInTheDocument();
  });
});

async function waitForList(): Promise<void> {
  await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(5));
}
