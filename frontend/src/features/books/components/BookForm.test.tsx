import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { BookForm } from "@/features/books/components";
import { GENRES } from "@/features/books/types";
import { conflictError, validationError } from "@/test/handlers/errors";
import { server } from "@/test/server";
import { act, renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";

const VALID_INPUT = {
  title: "The Unquiet Archive",
  author: "Ada Lovelace",
  genre: "Fantasy",
  synopsis: "A catalog of doors that open only once.",
};

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Title"), VALID_INPUT.title);
  await user.type(screen.getByLabelText("Author"), VALID_INPUT.author);
  await user.selectOptions(screen.getByLabelText("Genre"), VALID_INPUT.genre);
  await user.type(screen.getByLabelText("Synopsis"), VALID_INPUT.synopsis);
  return user;
}

describe("BookForm", () => {
  it("renders all form fields", () => {
    renderWithProviders(<BookForm />, { route: "/books/create" });

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Author")).toBeInTheDocument();
    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    expect(screen.getByLabelText("Synopsis")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Catalog the Book" })).toBeInTheDocument();
  });

  it("lists every genre from the GENRES constant as an option", () => {
    renderWithProviders(<BookForm />, { route: "/books/create" });

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(GENRES.length + 1);
    for (const genre of GENRES) {
      expect(screen.getByRole("option", { name: genre })).toBeInTheDocument();
    }
  });

  it("shows required-field errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookForm />, { route: "/books/create" });

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Author is required.")).toBeInTheDocument();
    expect(screen.getByText("Select a genre.")).toBeInTheDocument();
    expect(screen.getByText("Synopsis is required.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears a field error once the user starts typing in that field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookForm />, { route: "/books/create" });

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));
    expect(screen.getByText("Title is required.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Title"), "T");
    expect(screen.queryByText("Title is required.")).not.toBeInTheDocument();
  });

  it("shows a pending state on the submit button while the mutation is in flight", async () => {
    let resolveRequest: (value: HttpResponse<typeof VALID_INPUT>) => void;
    server.use(
      http.post("/api/books", () =>
        new Promise<HttpResponse<typeof VALID_INPUT>>((resolve) => {
          resolveRequest = resolve;
        }),
      ),
    );

    renderWithProviders(<BookForm />, { route: "/books/create" });
    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    const pendingButton = screen.getByRole("button", { name: "Cataloging..." });
    expect(pendingButton).toBeDisabled();

    await act(async () => {
      resolveRequest(HttpResponse.json(VALID_INPUT, { status: 201 }));
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Catalog the Book" })).toBeEnabled(),
    );
  });

  it("calls onCreated after a successful creation and resets the form", async () => {
    const onCreated = vi.fn();
    renderWithProviders(<BookForm onCreated={onCreated} />, { route: "/books/create" });
    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Author")).toHaveValue("");
    expect(screen.getByLabelText("Genre")).toHaveValue("");
    expect(screen.getByLabelText("Synopsis")).toHaveValue("");
  });

  it("shows field-level API errors under the respective fields", async () => {
    server.use(
      http.post("/api/books", () =>
        validationError("Validation failed", {
          title: "A book with this title already exists",
          author: "Author is required",
        }),
      ),
    );

    renderWithProviders(<BookForm />, { route: "/books/create" });
    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    expect(
      await screen.findByText("A book with this title already exists"),
    ).toBeInTheDocument();
    expect(screen.getByText("Author is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows form-level API errors through an alert", async () => {
    server.use(
      http.post("/api/books", () => conflictError("A volume by this name and author already exists.")),
    );

    renderWithProviders(<BookForm />, { route: "/books/create" });
    const user = await fillValidForm();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("A volume by this name and author already exists.");
  });

  it("renders a back link to the catalog", () => {
    renderWithProviders(<BookForm />, { route: "/books/create" });

    expect(screen.getByRole("link", { name: /Back to catalog/ })).toHaveAttribute(
      "href",
      "/books",
    );
  });

  it("exposes accessible form semantics", async () => {
    renderWithProviders(<BookForm />, { route: "/books/create" });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Catalog the Book" }));

    const title = screen.getByLabelText("Title");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAttribute("aria-required", "true");
    expect(title).toHaveAttribute("aria-describedby", "title-error");
    expect(screen.getByText("Title is required.")).toHaveAttribute("id", "title-error");
  });
});
