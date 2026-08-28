import { http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import BooksPage from "@/pages/BooksPage";
import CreateBookPage from "@/pages/CreateBookPage";
import { server } from "@/test/server";
import { conflictError, internalError } from "@/test/handlers/errors";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";

const NEW_BOOK = {
  title: "The Observatory at the Edge of Sleep",
  author: "Nadia Voss",
  genre: "Horror",
  synopsis: "An astronomer records the stars as they dim one by one.",
};

function renderCreateApp(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <></> },
      { path: "/books", element: <BooksPage /> },
      { path: "/books/create", element: <CreateBookPage /> },
      { path: "/books/:id", element: <></> },
    ],
    { initialEntries: [initialEntry] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

async function fillNewBookForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Title"), NEW_BOOK.title);
  await user.type(screen.getByLabelText("Author"), NEW_BOOK.author);
  await user.selectOptions(screen.getByLabelText("Genre"), NEW_BOOK.genre);
  await user.type(screen.getByLabelText("Synopsis"), NEW_BOOK.synopsis);
  return user;
}

describe("CreateBookPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a book and redirects to the catalog with the new volume listed", async () => {
    renderCreateApp("/books/create");

    const user = await fillNewBookForm();
    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument(),
    );
    await waitFor(() => expect(screen.getByText(NEW_BOOK.title)).toBeInTheDocument());
  });

  it("shows validation errors and stays on the page when the form is empty", async () => {
    const user = userEvent.setup();
    renderCreateApp("/books/create");

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Author is required.")).toBeInTheDocument();
    expect(screen.getByText("Select a genre.")).toBeInTheDocument();
    expect(screen.getByText("Synopsis is required.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add a New Volume" })).toBeInTheDocument();
  });

  it("shows a form-level error and stays on the page when a duplicate is created", async () => {
    server.use(
      http.post("/api/books", () =>
        conflictError("A volume by this name and author already exists."),
      ),
    );

    renderCreateApp("/books/create");
    const user = await fillNewBookForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("A volume by this name and author already exists.");
    expect(screen.getByRole("heading", { name: "Add a New Volume" })).toBeInTheDocument();
  });

  it("shows a form-level error and stays on the page when the server fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.post("/api/books", () => internalError("The cataloging rite failed.")));

    renderCreateApp("/books/create");
    const user = await fillNewBookForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The cataloging rite failed.");
    expect(screen.getByRole("heading", { name: "Add a New Volume" })).toBeInTheDocument();
  });

  it("navigates from the catalog to the create page", async () => {
    renderCreateApp("/books");

    await userEvent.click(screen.getByRole("link", { name: "Create Book" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Add a New Volume" })).toBeInTheDocument(),
    );
  });
});
