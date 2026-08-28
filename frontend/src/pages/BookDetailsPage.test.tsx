import { http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookDetailsPage from "@/pages/BookDetailsPage";
import BooksPage from "@/pages/BooksPage";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";

const SEED_ID = "64f1c2e5a1b2c3d4e5f6a001";

function renderBookDetailsApp(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <></> },
      { path: "/books", element: <BooksPage /> },
      { path: "/books/:id", element: <BookDetailsPage /> },
    ],
    { initialEntries: [initialEntry] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

describe("BookDetailsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads a book from the mocked API and renders its details", async () => {
    renderBookDetailsApp(`/books/${SEED_ID}`);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "The Whisper of the Void" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("by Isabella Marchetti")).toBeInTheDocument();
    expect(screen.getByText("Horror")).toBeInTheDocument();
  });

  it("displays the not-found state for an unknown id", async () => {
    renderBookDetailsApp("/books/64f1c2e5a1b2c3d4e5f6afff");

    await waitFor(() =>
      expect(screen.getByText("This volume does not exist in the catalog.")).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /back to the catalog/i })).toBeInTheDocument();
  });

  it("displays an error state and recovers on retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("/api/books/:id", () => internalError()));

    renderBookDetailsApp(`/books/${SEED_ID}`);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("The archive could not be reached.")).toBeInTheDocument();

    server.resetHandlers();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "The Whisper of the Void" }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates back to the book list", async () => {
    renderBookDetailsApp(`/books/${SEED_ID}`);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "The Whisper of the Void" }),
      ).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("link", { name: /back to catalog/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument(),
    );
  });
});
