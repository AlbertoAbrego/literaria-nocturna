import { QueryClient } from "@tanstack/react-query";
import { http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookDetailsPage from "@/pages/BookDetailsPage";
import BooksPage from "@/pages/BooksPage";
import EditBookPage from "@/pages/EditBookPage";
import { server } from "@/test/server";
import { conflictError, internalError } from "@/test/handlers/errors";
import { act, renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";

const SEED_ID = "64f1c2e5a1b2c3d4e5f6a001";

const UPDATED_BOOK = {
  title: "The Revised Whisper",
  author: "Isabella Marchetti",
  genre: "Horror",
  synopsis: "A scholar discovers that her university library is cataloging books that should not exist.",
};

function renderEditApp(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <></> },
      { path: "/books", element: <BooksPage /> },
      { path: "/books/:id", element: <BookDetailsPage /> },
      { path: "/books/:id/edit", element: <EditBookPage /> },
    ],
    { initialEntries: [initialEntry] },
  );
  return renderWithProviders(<RouterProvider router={router} />);
}

async function submitUpdate(title: string) {
  const user = userEvent.setup();
  const titleInput = await screen.findByLabelText("Title");
  await user.clear(titleInput);
  await user.type(titleInput, title);
  await user.click(screen.getByRole("button", { name: "Update the Book" }));
  return user;
}

describe("EditBookPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pre-populates the form with the volume's current values", async () => {
    renderEditApp(`/books/${SEED_ID}/edit`);

    expect(await screen.findByLabelText("Title")).toHaveValue("The Whisper of the Void");
    expect(screen.getByLabelText("Author")).toHaveValue("Isabella Marchetti");
    expect(screen.getByLabelText("Genre")).toHaveValue("Horror");
    expect(screen.getByLabelText("Synopsis")).toHaveValue(
      "A scholar discovers that her university library is cataloging books that should not exist.",
    );
    expect(screen.getByRole("heading", { name: "Edit Volume" })).toBeInTheDocument();
  });

  it("updates the volume, shows fresh details, and reflects the change in the catalog", async () => {
    renderEditApp(`/books/${SEED_ID}/edit`);

    await submitUpdate(UPDATED_BOOK.title);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: UPDATED_BOOK.title })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("link", { name: /back to catalog/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument(),
    );
    expect(screen.getByText(UPDATED_BOOK.title)).toBeInTheDocument();
    expect(screen.queryByText("The Whisper of the Void")).not.toBeInTheDocument();
  });

  it("invalidates the cached list and detail queries after an update", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: 5 * 60 * 1000 },
        mutations: { retry: false },
      },
    });
    const router = createMemoryRouter(
      [
        { path: "/", element: <></> },
        { path: "/books", element: <BooksPage /> },
        { path: "/books/:id", element: <BookDetailsPage /> },
        { path: "/books/:id/edit", element: <EditBookPage /> },
      ],
      { initialEntries: ["/books"] },
    );
    renderWithProviders(<RouterProvider router={router} />, { queryClient });

    await waitFor(() => expect(screen.getByText("The Whisper of the Void")).toBeInTheDocument());

    await act(async () => {
      await router.navigate(`/books/${SEED_ID}/edit`);
    });

    await submitUpdate(UPDATED_BOOK.title);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: UPDATED_BOOK.title })).toBeInTheDocument(),
    );

    await act(async () => {
      await router.navigate("/books");
    });

    await waitFor(() => expect(screen.getByText(UPDATED_BOOK.title)).toBeInTheDocument());
    expect(screen.queryByText("The Whisper of the Void")).not.toBeInTheDocument();
  });

  it("displays the not-found state for an unknown id", async () => {
    renderEditApp("/books/64f1c2e5a1b2c3d4e5f6afff/edit");

    await waitFor(() =>
      expect(screen.getByText("This volume does not exist in the catalog.")).toBeInTheDocument(),
    );
  });

  it("displays an error state and recovers on retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.get("/api/books/:id", () => internalError()));

    renderEditApp(`/books/${SEED_ID}/edit`);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("The archive could not be reached.")).toBeInTheDocument();

    server.resetHandlers();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Title")).toHaveValue("The Whisper of the Void"),
    );
  });

  it("shows validation errors and stays on the page when a required field is cleared", async () => {
    renderEditApp(`/books/${SEED_ID}/edit`);

    const title = await screen.findByLabelText("Title");
    await userEvent.clear(title);
    await userEvent.click(screen.getByRole("button", { name: "Update the Book" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Edit Volume" })).toBeInTheDocument();
  });

  it("shows a form-level conflict error and stays on the page", async () => {
    server.use(
      http.patch("/api/books/:id", () =>
        conflictError("A volume by this name and author already exists."),
      ),
    );

    renderEditApp(`/books/${SEED_ID}/edit`);

    await userEvent.click(await screen.findByRole("button", { name: "Update the Book" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("A volume by this name and author already exists.");
    expect(screen.getByRole("heading", { name: "Edit Volume" })).toBeInTheDocument();
  });

  it("navigates from the volume details to the edit page", async () => {
    renderEditApp(`/books/${SEED_ID}`);

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "The Whisper of the Void" })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("link", { name: /edit this volume/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Edit Volume" })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Title")).toHaveValue("The Whisper of the Void");
  });
});