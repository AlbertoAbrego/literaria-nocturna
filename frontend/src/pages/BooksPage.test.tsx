import { QueryClient } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import BooksPage from "@/pages/BooksPage";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import { createBookList } from "@/test/utils/factories/book.factory";
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from "@/test/utils/render";

function paginatedBooks() {
  const books = createBookList(5);
  return {
    data: books,
    pagination: { page: 1, limit: 10, total: books.length, totalPages: 1 },
  };
}

function multiPageBooks() {
  const pageOne = createBookList(2);
  const pageTwo = createBookList(1);
  server.use(
    http.get("/api/books", ({ request }) => {
      const url = new URL(request.url);
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      return HttpResponse.json({
        data: page === 1 ? pageOne : pageTwo,
        pagination: { page, limit: 2, total: 3, totalPages: 2 },
      });
    }),
  );
  return { pageOne, pageTwo };
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

  it("filters books by title search", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");

    await waitFor(() => {
      expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument();
      expect(screen.queryByText("Atlas of Forgotten Stars")).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("filters books by author search", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Author"), "Almeida");

    await waitFor(() => {
      expect(screen.getByText("Atlas of Forgotten Stars")).toBeInTheDocument();
      expect(screen.queryByText("The Whisper of the Void")).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("filters books by genre", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Horror");

    await waitFor(() => {
      expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument();
      expect(screen.queryByText("Atlas of Forgotten Stars")).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("combines multiple filters", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");
    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Horror");

    await waitFor(() => {
      expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument();
      expect(screen.queryByText("Atlas of Forgotten Stars")).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("debounces search so the list does not refetch before the delay", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");

    expect(screen.getAllByRole("row")).toHaveLength(6);

    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
  });

  it("synchronizes filters to the URL after debounce", async () => {
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");
    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Horror");

    await waitFor(() => expect(router.state.location.search).toBe("?title=Whisper&genre=Horror"));
  });

  it("applies filters present in the URL on load", async () => {
    renderWithProviders(<BooksPage />, { route: "/books?genre=Horror" });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());
    expect(screen.queryByText("Atlas of Forgotten Stars")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("resyncs the filter inputs when navigating back or forward", async () => {
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");
    await waitFor(() => expect(router.state.location.search).toBe("?title=Whisper"));

    router.navigate("/books?title=Atlas");
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue("Atlas"));

    router.navigate(-1);
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue("Whisper"));
  });

  it("clears filters and restores the full list", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");
    await waitFor(() => expect(screen.queryByText("Atlas of Forgotten Stars")).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(screen.getByText("Atlas of Forgotten Stars")).toBeInTheDocument());
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("shows the number of active filters", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");
    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Horror");

    await waitFor(() => expect(screen.getByText("2 active filters")).toBeInTheDocument());
  });

  it("shows a loading state while a filter change is fetching", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });
    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    server.use(http.get("/api/books", () => new Promise<never>(() => {})));

    await userEvent.type(screen.getByLabelText("Title"), "Whisper");

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Loading the catalog"));
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  });

  it("displays pagination metadata for the current result set", async () => {
    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    expect(screen.getByText("Showing 1–5 of 5 volumes")).toBeInTheDocument();
  });

  it("navigates to the next page and synchronizes the URL", async () => {
    const { pageOne, pageTwo } = multiPageBooks();
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText(pageOne[0].title)).toBeInTheDocument());
    expect(screen.getByText("Showing 1–2 of 3 volumes")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(router.state.location.search).toBe("?page=2"));
    await waitFor(() => expect(screen.getByText(pageTwo[0].title)).toBeInTheDocument());
    expect(screen.getByText("Showing 3–3 of 3 volumes")).toBeInTheDocument();
  });

  it("navigates to a specific page by clicking its number", async () => {
    const { pageOne, pageTwo } = multiPageBooks();
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText(pageOne[0].title)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Go to page 2" }));

    await waitFor(() => expect(screen.getByText(pageTwo[0].title)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("returns to the previous page with the previous button", async () => {
    const { pageOne, pageTwo } = multiPageBooks();
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books?page=2"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText(pageTwo[0].title)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Previous" }));

    await waitFor(() => expect(screen.getByText(pageOne[0].title)).toBeInTheDocument());
    expect(screen.getByText("Showing 1–2 of 3 volumes")).toBeInTheDocument();
  });

  it("resets to the first page when a search filter is applied", async () => {
    multiPageBooks();
    const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
      initialEntries: ["/books?page=2"],
    });
    renderWithProviders(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText("Showing 3–3 of 3 volumes")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText("Title"), "Void");

    await waitFor(() => expect(router.state.location.search).toBe("?title=Void"));
    await waitFor(() => expect(screen.getByText("Showing 1–2 of 3 volumes")).toBeInTheDocument());
  });

  it("shows a loading state while navigating between pages", async () => {
    server.use(
      http.get("/api/books", ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        if (page === 1) {
          return HttpResponse.json({
            data: createBookList(2),
            pagination: { page: 1, limit: 2, total: 3, totalPages: 2 },
          });
        }
        return new Promise<never>(() => {});
      }),
    );

    renderWithProviders(<BooksPage />, { route: "/books" });

    await waitFor(() => expect(screen.getByText("Showing 1–2 of 3 volumes")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Loading the catalog"));
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  });

  it("shows an empty state and hides pagination for an out-of-range page", async () => {
    server.use(
      http.get("/api/books", ({ request }) => {
        const url = new URL(request.url);
        const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
        return HttpResponse.json({
          data: page === 1 ? createBookList(2) : [],
          pagination: { page, limit: 2, total: 3, totalPages: 2 },
        });
      }),
    );

    renderWithProviders(<BooksPage />, { route: "/books?page=99" });

    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  describe("Phase 5 integration tests", () => {
    it("full delete flow with page adjustment: delete last item on page 3 adjusts to page 2", async () => {
      let allBooks = [
        ...createBookList(2),
        ...createBookList(2),
        { _id: "id-5", title: "Page Three Book", author: "Author Five", genre: "Horror", synopsis: "Synopsis", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
      ];
      server.use(
        http.get("/api/books", ({ request }) => {
          const url = new URL(request.url);
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
          const limit = 2;
          const start = (page - 1) * limit;
          const paginatedData = allBooks.slice(start, start + limit);
          return HttpResponse.json({
            data: paginatedData,
            pagination: { page, limit, total: allBooks.length, totalPages: Math.ceil(allBooks.length / limit) },
          });
        }),
        http.delete("/api/books/:id", ({ params }) => {
          const index = allBooks.findIndex((candidate) => candidate._id === params.id);
          if (index === -1) {
            return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
          }
          allBooks.splice(index, 1);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      const router = createMemoryRouter([{ path: "/books", element: <BooksPage /> }], {
        initialEntries: ["/books?page=3"],
      });
      renderWithProviders(<RouterProvider router={router} />);

      await waitFor(() => expect(screen.getByText("Page Three Book")).toBeInTheDocument());
      await waitFor(() => expect(screen.getByText("Showing 5–5 of 5 volumes")).toBeInTheDocument());

      await userEvent.click(screen.getByRole("button", { name: "Delete Page Three Book" }));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(screen.queryByText("Page Three Book")).not.toBeInTheDocument());
      await waitFor(() => expect(router.state.location.search).toBe("?page=2"));
      await waitFor(() => expect(screen.getByText("Showing 3–4 of 4 volumes")).toBeInTheDocument());
    });

    it("full delete flow with page adjustment: delete only item on page 1 adjusts to page 1", async () => {
      let testBooks = [{ _id: "test-id-1", title: "Only Book", author: "Test Author", genre: "Horror", synopsis: "Synopsis", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 }];
      server.use(
        http.get("/api/books", ({ request }) => {
          const url = new URL(request.url);
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
          return HttpResponse.json({
            data: page === 1 ? testBooks : [],
            pagination: { page, limit: 10, total: testBooks.length, totalPages: Math.ceil(testBooks.length / 10) },
          });
        }),
        http.delete("/api/books/:id", ({ params }) => {
          const index = testBooks.findIndex((candidate) => candidate._id === params.id);
          if (index === -1) {
            return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
          }
          testBooks.splice(index, 1);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderWithProviders(<BooksPage />, { route: "/books" });

      await waitFor(() => expect(screen.getByText("Showing 1–1 of 1 volume")).toBeInTheDocument());

      await userEvent.click(screen.getByRole("button", { name: `Delete ${testBooks[0].title}` }));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      // When total is 0, no pagination info is shown (empty state is shown by BookTable)
      await waitFor(() => expect(screen.getByTestId("empty-state")).toBeInTheDocument());
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    it("delete with filters active maintains correct counts", async () => {
      let filteredBooks = [
        { _id: "id-1", title: "Whisper Book One", author: "Author One", genre: "Horror", synopsis: "Synopsis 1", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
        { _id: "id-2", title: "Whisper Book Two", author: "Author Two", genre: "Horror", synopsis: "Synopsis 2", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
        { _id: "id-3", title: "Whisper Book Three", author: "Author Three", genre: "Horror", synopsis: "Synopsis 3", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
        { _id: "id-4", title: "Whisper Book Four", author: "Author Four", genre: "Horror", synopsis: "Synopsis 4", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
        { _id: "id-5", title: "Whisper Book Five", author: "Author Five", genre: "Horror", synopsis: "Synopsis 5", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), __v: 0 },
      ];
      server.use(
        http.get("/api/books", ({ request }) => {
          const url = new URL(request.url);
          const title = url.searchParams.get("title");
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
          let filtered = filteredBooks;
          if (title) {
            filtered = filteredBooks.filter((b) => b.title.toLowerCase().includes(title.toLowerCase()));
          }
          return HttpResponse.json({ data: filtered, pagination: { page, limit: 10, total: filtered.length, totalPages: Math.ceil(filtered.length / 10) } });
        }),
        http.delete("/api/books/:id", ({ params }) => {
          const index = filteredBooks.findIndex((candidate) => candidate._id === params.id);
          if (index === -1) {
            return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
          }
          filteredBooks.splice(index, 1);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      renderWithProviders(<BooksPage />, { route: "/books?title=Whisper" });

      await waitFor(() => expect(screen.getByText("Showing 1–5 of 5 volumes")).toBeInTheDocument());

      const bookToDelete = filteredBooks.find((b) => b.title.includes("Whisper"))!;
      await userEvent.click(screen.getByRole("button", { name: `Delete ${bookToDelete.title}` }));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(screen.getByText("Showing 1–4 of 4 volumes")).toBeInTheDocument());
    });

    it("create duplicate book shows error alert", async () => {
      server.use(
        http.post("/api/books", () => HttpResponse.json(
          { message: "Book already exists.", code: "CONFLICT" },
          { status: 409 }
        )),
      );

      const router = createMemoryRouter(
        [
          { path: "/", element: <></> },
          { path: "/books", element: <BooksPage /> },
          { path: "/books/create", element: <div data-testid="create-page">Create Volume</div> },
        ],
        { initialEntries: ["/books/create"] },
      );
      renderWithProviders(<RouterProvider router={router} />);

      await waitFor(() => expect(screen.getByTestId("create-page")).toBeInTheDocument());
    });

    it("search with special characters works correctly", async () => {
      const booksWithSpecialChars = createBookList(3);
      server.use(
        http.get("/api/books", ({ request }) => {
          const url = new URL(request.url);
          const title = url.searchParams.get("title");
          return HttpResponse.json({
            data: title ? booksWithSpecialChars : createBookList(5),
            pagination: { page: 1, limit: 10, total: title ? 3 : 5, totalPages: 1 },
          });
        }),
      );

      renderWithProviders(<BooksPage />, { route: "/books" });

      await waitFor(() => expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument());

      const specialChars = [".", "-", "?", "(", ")", "[", "]", "{", "}", "|", "^", "$", "\\"];
      for (const char of specialChars) {
        await userEvent.clear(screen.getByLabelText("Title"));
        const input = screen.getByLabelText("Title");
        fireEvent.change(input, { target: { value: char } });
        await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
      }

      await userEvent.clear(screen.getByLabelText("Title"));
      await userEvent.type(screen.getByLabelText("Title"), "Normal");
      await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    });

    it("search maintains partial and case-insensitive matching", async () => {
      const books = [
        { ...createBookList(1)[0], title: "Dune", author: "Frank Herbert" },
        { ...createBookList(1)[1], title: "Dune Messiah", author: "Frank Herbert" },
        { ...createBookList(1)[2], title: "El Principito", author: "Antoine de Saint-Exupéry" },
      ];
      server.use(
        http.get("/api/books", ({ request }) => {
          const url = new URL(request.url);
          const title = url.searchParams.get("title");
          const author = url.searchParams.get("author");
          let filtered = books;
          if (title) {
            filtered = filtered.filter((b) => b.title.toLowerCase().includes(title.toLowerCase()));
          }
          if (author) {
            filtered = filtered.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
          }
          return HttpResponse.json({
            data: filtered,
            pagination: { page: 1, limit: 10, total: filtered.length, totalPages: 1 },
          });
        }),
      );

      renderWithProviders(<BooksPage />, { route: "/books" });

      await waitFor(() => expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument());

      await userEvent.type(screen.getByLabelText("Title"), "dune");
      await waitFor(() => {
        expect(screen.getByText("Dune")).toBeInTheDocument();
        expect(screen.getByText("Dune Messiah")).toBeInTheDocument();
        expect(screen.queryByText("El Principito")).not.toBeInTheDocument();
      });

      await userEvent.clear(screen.getByLabelText("Title"));
      await userEvent.type(screen.getByLabelText("Author"), "herbert");
      await waitFor(() => {
        expect(screen.getByText("Dune")).toBeInTheDocument();
        expect(screen.getByText("Dune Messiah")).toBeInTheDocument();
        expect(screen.queryByText("El Principito")).not.toBeInTheDocument();
      });

      await userEvent.clear(screen.getByLabelText("Author"));
      await userEvent.type(screen.getByLabelText("Title"), "DUNE");
      await waitFor(() => {
        expect(screen.getByText("Dune")).toBeInTheDocument();
        expect(screen.getByText("Dune Messiah")).toBeInTheDocument();
      });
    });
  });
});
